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
  const model = process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.3-70b-instruct:free';
  if (!apiKey) {
    return { skillsScore: null, matchedPoints: [], gapPoints: [], aiFailed: true };
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
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
      return { skillsScore: null, matchedPoints: [], gapPoints: [], aiFailed: true };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { skillsScore: null, matchedPoints: [], gapPoints: [], aiFailed: true };

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
      return { skillsScore: null, matchedPoints: [], gapPoints: [], aiFailed: true };
    }

    return { skillsScore, matchedPoints, gapPoints, aiFailed: false };
  } catch (err) {
    console.error('[scoring:ai] OpenRouter call failed', err);
    return { skillsScore: null, matchedPoints: [], gapPoints: [], aiFailed: true };
  }
}
