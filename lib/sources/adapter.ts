import { fetchAllJobs } from './alljobs';
import { fetchDrushim } from './drushim';
import { fetchIndeedIsrael } from './indeedIsrael';
import { fetchLinkedIn } from './linkedin';
import type { RawListing } from './types';
import type { Source, SourceStatus } from '@/types/domain';

export interface FetchListingsParams {
  locations: string[];
  domains: string[];
}

export interface FetchListingsResult {
  listings: RawListing[];
  sourceStatus: SourceStatus;
}

const FETCHERS: Record<
  Source,
  (p: {
    location: string;
    domains: string[];
    limit: number;
    onRetry?: (retryNumber: number) => void;
    demo?: boolean;
  }) => Promise<{ listings: RawListing[]; status: 'ok' | 'failed' }>
> = {
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
 *
 * `onSourceSettled` fires as each source's actor call resolves (not just once all four are
 * done) — the search-progress UI uses it to check off platforms as they finish.
 * `onSourceRetry` fires each time a source's Apify call is retried after a transient failure,
 * so the UI can show that a platform is being re-attempted rather than silently stalling.
 */
export async function fetchListings(
  params: FetchListingsParams,
  onSourceSettled?: (source: Source, status: 'ok' | 'failed') => void,
  options: {
    demo?: boolean;
    onSourceRetry?: (source: Source, retryNumber: number) => void;
  } = {}
): Promise<FetchListingsResult> {
  const limit = Number(process.env.APIFY_RESULTS_PER_SOURCE ?? 5);
  const sources = Object.keys(FETCHERS) as Source[];
  // Actors take a single location string each; multi-location selection is joined here for
  // the actor's own (best-effort) filter — deterministic scoring against every selected
  // location afterward is what's actually authoritative (lib/scoring/deterministic.ts).
  const location = params.locations.join(', ');

  const results = await Promise.all(
    sources.map((source) =>
      FETCHERS[source]({
        location,
        domains: params.domains,
        limit,
        demo: options.demo,
        onRetry: (retryNumber) => options.onSourceRetry?.(source, retryNumber),
      }).then((result) => {
        onSourceSettled?.(source, result.status);
        return result;
      })
    )
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
