import { ApifyClient } from 'apify-client';
import type { RawListing, SourceFetchResult } from './types';
import type { Source } from '@/types/domain';
import { sleep, backoffMs } from '@/lib/retry';
import type { DemoActorFault } from '@/lib/demo/faults';

let client: ApifyClient | null = null;

function getClient(): ApifyClient {
  if (!client) {
    if (!process.env.APIFY_TOKEN) throw new Error('APIFY_TOKEN is not set');
    client = new ApifyClient({ token: process.env.APIFY_TOKEN });
  }
  return client;
}

/** Total attempts per source (1 initial + up to 2 retries). Kept at 3 deliberately: every
 * retry that re-runs the actor is another paid Apify run (SPEC.md Part 5). */
const MAX_ATTEMPTS = 3;

export interface RunActorOptions {
  /** Fires once per retry, before the backoff wait — `retryNumber` is 1-based (1 = first retry). */
  onRetry?: (retryNumber: number) => void;
  /** Demo failure scenario: short-circuits the real Apify calls with a scripted fault. */
  demo?: DemoActorFault;
}

interface MinimalRun {
  defaultDatasetId: string;
}

/**
 * Runs one Apify actor and maps its dataset items to RawListing, with bounded retries.
 * Never throws to the caller — a source that fails every attempt degrades to status
 * 'failed' with an empty list (CLAUDE.md: degrade visibly, don't drop results silently).
 *
 * Retry cost control: a successful actor run is kept across attempts, so a failure in the
 * (free) dataset read retries the read alone — only a failure of the (paid) `.call()` itself
 * spends another run, and at most twice.
 *
 * `limit` is enforced here too, independent of whatever result-count field was set in
 * `input` — a wrong/ignored field name on the actor's side (already happened once: LinkedIn's
 * actor doesn't recognize `maxItems` and ran to ~285 results before this existed) must not
 * turn into 285 downstream OpenRouter calls.
 */
export async function runActor(
  source: Source,
  actorId: string | undefined,
  input: Record<string, unknown>,
  limit: number,
  mapItem: (item: Record<string, unknown>) => RawListing | null,
  options: RunActorOptions = {}
): Promise<SourceFetchResult> {
  const { onRetry, demo } = options;
  if (!actorId && !demo) {
    return { listings: [], status: 'failed' };
  }

  let run: MinimalRun | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      if (demo) {
        if (attempt <= demo.callFailsUpToAttempt) {
          throw new Error(`[demo] ${source} actor call failed (attempt ${attempt})`);
        }
        if (!run) run = { defaultDatasetId: `demo-${source}` };
        else console.info(`[apify:${source}] reusing run ${run.defaultDatasetId} — no new actor call`);
        if (demo.datasetFailsOnAttempts.includes(attempt)) {
          throw new Error(`[demo] ${source} dataset read failed (attempt ${attempt})`);
        }
        return { listings: demo.listings.slice(0, limit), status: 'ok' };
      }

      if (!run) {
        run = await getClient().actor(actorId!).call(input);
      } else {
        console.info(`[apify:${source}] reusing run ${run.defaultDatasetId} — no new actor call`);
      }
      const { items } = await getClient().dataset(run.defaultDatasetId).listItems({ limit });
      const listings = items
        .slice(0, limit)
        .map((item) => mapItem(item as Record<string, unknown>))
        .filter((x): x is RawListing => x !== null);
      return { listings, status: 'ok' };
    } catch (err) {
      console.error(`[apify:${source}] attempt ${attempt}/${MAX_ATTEMPTS} failed`, err);
      if (attempt === MAX_ATTEMPTS) {
        return { listings: [], status: 'failed' };
      }
      onRetry?.(attempt);
      await sleep(backoffMs(attempt));
    }
  }

  return { listings: [], status: 'failed' };
}

export function buildRawText(description: string, requirements: string[]): string {
  return [description, ...requirements].join('\n');
}
