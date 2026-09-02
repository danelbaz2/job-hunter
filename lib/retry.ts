export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Exponential backoff with full jitter, capped. `attempt` is 1-based (the delay to wait
 * *after* the Nth failed attempt). Kept small on purpose — every retry against Apify can
 * cost another paid actor run (SPEC.md Part 5), so this is a short nudge past a transient
 * blip, not a long resilience budget.
 */
export function backoffMs(attempt: number, baseMs = 800, capMs = 4000): number {
  const exp = Math.min(capMs, baseMs * 2 ** (attempt - 1));
  return Math.round(exp / 2 + Math.random() * (exp / 2));
}
