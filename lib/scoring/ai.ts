import type { RawListing } from '@/lib/sources/types';
import type { MatchPoint } from '@/types/domain';

export interface SkillsFitResult {
  skillsScore: number | null;
  matchedPoints: MatchPoint[];
  gapPoints: MatchPoint[];
  aiFailed: boolean;
}

const SYSTEM_PROMPT = `You compare a candidate's resume against one job listing's text.
Return strict JSON only, matching this shape:
{
  "skillsScore": <integer 0-100>,
  "matched": [{ "text": "<short claim of a fit point>", "quote": "<verbatim substring copied exactly from the listing text below>" }],
  "gaps": [{ "text": "<short claim of a missing point>", "quote": "<verbatim substring copied exactly from the listing text below>" }]
}
Every "quote" MUST be copied character-for-character from the listing text — do not paraphrase or invent it.
If you cannot find a real quote for a point, omit that point entirely rather than inventing one.`;

/**
 * Never returns a fabricated match/gap point (CLAUDE.md non-negotiable): every quote is
 * verified as a verbatim substring of the listing's rawText before being kept. A point
 * whose quote doesn't verify is dropped, not corrected — we don't trust the model to fix it.
 */
export async function scoreSkillsFit(resumeText: string, listing: RawListing): Promise<SkillsFitResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL ?? 'nvidia/nemotron-3-super-120b-a12b:free';
  if (!apiKey) {
    console.error('[scoring:ai] OPENROUTER_API_KEY is not set');
    return { skillsScore: null, matchedPoints: [], gapPoints: [], aiFailed: true };
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      // Free-tier models can stall upstream with no error for minutes (seen: a 504
      // "Upstream idle timeout exceeded" after 144s) — fail fast instead of blocking
      // the whole search. A timeout here is exactly another form of AI failure: same
      // fallback (aiFailed: true) as a bad response or a parse error.
      signal: AbortSignal.timeout(20_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        // Tested at effort=none vs default: identical scores/quote quality, ~85% fewer
        // tokens and far lower latency — this task is extraction/comparison, not the kind
        // of multi-step logic reasoning mode is for.
        reasoning: { enabled: false },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `RESUME:\n${resumeText}\n\nLISTING TEXT:\n${listing.rawText}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[scoring:ai] OpenRouter returned ${res.status} for model "${model}": ${body}`);
      return { skillsScore: null, matchedPoints: [], gapPoints: [], aiFailed: true };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('[scoring:ai] OpenRouter response had no message content', JSON.stringify(data));
      return { skillsScore: null, matchedPoints: [], gapPoints: [], aiFailed: true };
    }

    const parsed = JSON.parse(content) as {
      skillsScore?: number;
      matched?: { text: string; quote: string }[];
      gaps?: { text: string; quote: string }[];
    };

    const verify = (points: { text: string; quote: string }[] | undefined): MatchPoint[] =>
      (points ?? []).filter(
        (p): p is MatchPoint =>
          typeof p.text === 'string' &&
          typeof p.quote === 'string' &&
          p.quote.length > 0 &&
          listing.rawText.includes(p.quote)
      );

    const matchedPoints = verify(parsed.matched);
    const gapPoints = verify(parsed.gaps);
    const skillsScore =
      typeof parsed.skillsScore === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.skillsScore))) : null;

    if (skillsScore === null) {
      console.error('[scoring:ai] response had no valid numeric skillsScore', content);
      return { skillsScore: null, matchedPoints: [], gapPoints: [], aiFailed: true };
    }

    // SPEC.md Part 2, criterion 5: a listing must always show at least one matched point.
    // Seen for real on Hebrew-language listings — the model returned quotes that didn't
    // verify verbatim (likely answering in English), so every point got filtered out above,
    // leaving a confident score with zero supporting evidence. Treat that as a failed call
    // rather than show an unsupported number — never a score standing alone with no "why".
    if (matchedPoints.length === 0) {
      console.error('[scoring:ai] no matched points survived quote verification — treating as failed', content);
      return { skillsScore: null, matchedPoints: [], gapPoints: [], aiFailed: true };
    }

    return { skillsScore, matchedPoints, gapPoints, aiFailed: false };
  } catch (err) {
    console.error('[scoring:ai] OpenRouter call failed', err);
    return { skillsScore: null, matchedPoints: [], gapPoints: [], aiFailed: true };
  }
}
