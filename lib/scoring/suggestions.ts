import type { RawListing } from '@/lib/sources/types';
import type { ResumeSuggestion } from '@/types/domain';
import { openRouterChat } from '@/lib/openrouter';

export type SuggestionsResult =
  | { ok: true; items: ResumeSuggestion[] }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `You help a job seeker sharpen their existing resume for one specific listing.
Return strict JSON only:
{
  "items": [
    {
      "original": "<the exact resume line you are rewriting, or null for a new bullet built ONLY from content already in the resume>",
      "suggestion": "<the rewritten line — same facts, better aligned to this listing's wording>",
      "rationale": "<one sentence: which listing requirement this speaks to>"
    }
  ]
}
HARD RULES:
- Never invent experience, skills, tools, employers, titles, dates, metrics, or education the resume does not already state.
- Only rephrase, reorder, or surface what is already there. If the resume lacks something the listing wants, that is a gap — do NOT paper over it with a suggestion.
- 2 to 4 items. If the resume genuinely can't be improved truthfully for this listing, return {"items": []}.`;

/**
 * On-demand résumé suggestions for one listing (SPEC.md Part 2, criterion 8). Truthfulness
 * is the whole point — the prompt forbids inventing qualifications, and this never claims a
 * suggestion "raises fit" on its own; the user judges that (criterion 8 is user-measured).
 * Called once per listing the user opens, not for every listing found — keeps AI spend bounded.
 */
export async function generateResumeSuggestions(
  candidateText: string,
  listing: RawListing
): Promise<SuggestionsResult> {
  if (!candidateText.trim()) {
    return { ok: false, error: 'no-candidate-text' };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL ?? 'nvidia/nemotron-3-super-120b-a12b:free';
  if (!apiKey) {
    console.error('[scoring:suggestions] OPENROUTER_API_KEY is not set');
    return { ok: false, error: 'ai-unavailable' };
  }

  try {
    const res = await openRouterChat(
      apiKey,
      {
        model,
        response_format: { type: 'json_object' },
        reasoning: { enabled: false },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `CANDIDATE RESUME / SUMMARY:\n${candidateText}\n\nLISTING TEXT:\n${listing.rawText}` },
        ],
      },
      {
        timeoutMs: 20_000,
        onRetry: (attempt, reason) =>
          console.warn(`[scoring:suggestions] transient failure (${reason}) — retry ${attempt}`),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[scoring:suggestions] OpenRouter ${res.status} for "${model}": ${body}`);
      return { ok: false, error: 'ai-unavailable' };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('[scoring:suggestions] no message content', JSON.stringify(data));
      return { ok: false, error: 'ai-unavailable' };
    }

    const parsed = JSON.parse(content) as { items?: unknown };
    const items: ResumeSuggestion[] = Array.isArray(parsed.items)
      ? parsed.items
          .filter(
            (it): it is ResumeSuggestion =>
              !!it &&
              typeof it === 'object' &&
              typeof (it as ResumeSuggestion).suggestion === 'string' &&
              (it as ResumeSuggestion).suggestion.trim().length > 0 &&
              typeof (it as ResumeSuggestion).rationale === 'string'
          )
          .map((it) => ({
            original:
              typeof it.original === 'string' && it.original.trim().length > 0 ? it.original.trim() : null,
            suggestion: it.suggestion.trim(),
            rationale: it.rationale.trim(),
          }))
          .slice(0, 4)
      : [];

    return { ok: true, items };
  } catch (err) {
    console.error('[scoring:suggestions] call failed', err);
    return { ok: false, error: 'ai-unavailable' };
  }
}
