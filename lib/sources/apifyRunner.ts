import { ApifyClient } from 'apify-client';
import type { RawListing, SourceFetchResult } from './types';
import type { Source } from '@/types/domain';

let client: ApifyClient | null = null;

function getClient(): ApifyClient {
  if (!client) {
    if (!process.env.APIFY_TOKEN) throw new Error('APIFY_TOKEN is not set');
    client = new ApifyClient({ token: process.env.APIFY_TOKEN });
  }
  return client;
}

/**
 * Runs one Apify actor and maps its dataset items to RawListing.
 * Never throws to the caller — a failed source degrades to status 'failed' with
 * an empty list (CLAUDE.md: degrade visibly, don't drop results silently).
 */
export async function runActor(
  source: Source,
  actorId: string | undefined,
  input: Record<string, unknown>,
  mapItem: (item: Record<string, unknown>) => RawListing | null
): Promise<SourceFetchResult> {
  if (!actorId) {
    return { listings: [], status: 'failed' };
  }
  try {
    const run = await getClient().actor(actorId).call(input);
    const { items } = await getClient().dataset(run.defaultDatasetId).listItems();
    const listings = items
      .map((item) => mapItem(item as Record<string, unknown>))
      .filter((x): x is RawListing => x !== null);
    return { listings, status: 'ok' };
  } catch (err) {
    console.error(`[apify:${source}] actor run failed`, err);
    return { listings: [], status: 'failed' };
  }
}

export function buildRawText(description: string, requirements: string[]): string {
  return [description, ...requirements].join('\n');
}
