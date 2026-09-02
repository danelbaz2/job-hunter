import { sleep, backoffMs } from './retry';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export interface OpenRouterChatOptions {
  /** Per-attempt timeout. A fresh AbortSignal is created for each try. */
  timeoutMs?: number;
  /** Total tries, including the first. Default 3 (i.e. up to 2 retries). */
  maxAttempts?: number;
  /** Called after a failed attempt that will be retried — `reason` is a short label for logs/UI. */
  onRetry?: (attempt: number, reason: string) => void;
  /** Injected fetch, used only by the demo failure scenario to exercise this loop offline. */
  fetchImpl?: typeof fetch;
}

/**
 * One OpenRouter chat call with bounded retries for *transient* failures only:
 * network/timeout errors, HTTP 429, and HTTP 5xx. A non-429 4xx or any 2xx is returned
 * straight to the caller — those are not transient, and retrying them wastes the free-tier
 * budget (SPEC.md Part 5). Response-shape / quote-verification failures are the caller's
 * job and are never retried here.
 *
 * On a retryable status it honours a `Retry-After` header when present, else exponential
 * backoff with jitter. After the last attempt it returns the final Response (so the caller's
 * existing `!res.ok` handling still runs) or rethrows the last network error.
 */
export async function openRouterChat(
  apiKey: string,
  body: Record<string, unknown>,
  opts: OpenRouterChatOptions = {}
): Promise<Response> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const doFetch = opts.fetchImpl ?? fetch;
  const payload = JSON.stringify(body);

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await doFetch(ENDPOINT, {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: payload,
      });

      const retryable = res.status === 429 || res.status >= 500;
      if (retryable && attempt < maxAttempts) {
        const retryAfter = Number(res.headers.get('retry-after'));
        const waitMs =
          Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoffMs(attempt);
        await res.body?.cancel().catch(() => {});
        opts.onRetry?.(attempt, `HTTP ${res.status}`);
        await sleep(waitMs);
        continue;
      }

      return res;
    } catch (err) {
      lastErr = err;
      if (attempt >= maxAttempts) throw err;
      const reason = err instanceof Error && err.name ? err.name : 'network error';
      opts.onRetry?.(attempt, reason);
      await sleep(backoffMs(attempt));
    }
  }

  throw lastErr;
}
