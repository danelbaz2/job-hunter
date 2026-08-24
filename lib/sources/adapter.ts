import { fetchAllJobs } from './alljobs';
import { fetchDrushim } from './drushim';
import { fetchIndeedIsrael } from './indeedIsrael';
import { fetchLinkedIn } from './linkedin';
import type { RawListing } from './types';
import type { Source, SourceStatus } from '@/types/domain';

export interface FetchListingsParams {
  location: string;
  domains: string[];
}

export interface FetchListingsResult {
  listings: RawListing[];
  sourceStatus: SourceStatus;
}

const FETCHERS: Record<Source, (p: { location: string; domains: string[]; limit: number }) => Promise<{ listings: RawListing[]; status: 'ok' | 'failed' }>> = {
  alljobs: fetchAllJobs,
  drushim: fetchDrushim,
  indeed_il: fetchIndeedIsrael,
  linkedin: fetchLinkedIn,
};

function dedupeKey(l: RawListing): string {
  return `${l.title.trim().toLowerCase()}|${l.company.trim().toLowerCase()}|${l.location.trim().toLowerCase()}`;
}

/**
 * The single entry point to job data (CLAUDE.md: scoring/UI code never calls Apify directly).
 * Bounds results per source (SPEC.md Part 5 — Apify is pay-per-result) and dedupes listings
 * that appear from more than one source under the same title+company+location.
 */
export async function fetchListings(params: FetchListingsParams): Promise<FetchListingsResult> {
  const limit = Number(process.env.APIFY_RESULTS_PER_SOURCE ?? 5);
  const sources = Object.keys(FETCHERS) as Source[];

  const results = await Promise.all(
    sources.map((source) => FETCHERS[source]({ ...params, limit }))
  );

  const sourceStatus = {} as SourceStatus;
  const seen = new Set<string>();
  const listings: RawListing[] = [];

  sources.forEach((source, i) => {
    sourceStatus[source] = results[i].status;
    for (const listing of results[i].listings) {
      const key = dedupeKey(listing);
      if (seen.has(key)) continue;
      seen.add(key);
      listings.push(listing);
    }
  });

  return { listings, sourceStatus };
}
