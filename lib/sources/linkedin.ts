import { runActor, buildRawText } from './apifyRunner';
import type { RawListing, SourceFetchParams, SourceFetchResult } from './types';

/**
 * LinkedIn via an Apify LinkedIn-jobs-scraper actor, filtered to Israel.
 * README/mock: this source is the one expected to be occasionally unavailable
 * (shown as the LinkedIn ⚠ line in the searching-state checklist) — a failure here
 * is a normal, handled case, not an error state for the whole search.
 */
export async function fetchLinkedIn(params: SourceFetchParams): Promise<SourceFetchResult> {
  return runActor(
    'linkedin',
    process.env.APIFY_LINKEDIN_ACTOR_ID,
    {
      location: `${params.location}, Israel`,
      keywords: params.domains.join(' '),
      maxItems: params.limit,
    },
    (item): RawListing | null => {
      const externalId = String(item.id ?? item.jobId ?? item.jobUrl ?? '');
      const url = String(item.jobUrl ?? item.url ?? '');
      const title = String(item.title ?? '');
      if (!externalId || !url || !title) return null;

      const description = String(item.description ?? item.descriptionText ?? '');
      const requirements: string[] = [];

      return {
        source: 'linkedin',
        externalId,
        url,
        title,
        company: String(item.companyName ?? item.company ?? ''),
        location: String(item.location ?? params.location),
        postedAt: item.postedAt ? String(item.postedAt) : null,
        description,
        requirements,
        rawText: buildRawText(description, requirements),
      };
    }
  );
}
