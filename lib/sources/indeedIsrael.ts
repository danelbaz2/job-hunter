import { runActor, buildRawText } from './apifyRunner';
import type { RawListing, SourceFetchParams, SourceFetchResult } from './types';

/** Indeed.co.il via an Apify Indeed-scraper actor, filtered to Israel. */
export async function fetchIndeedIsrael(params: SourceFetchParams): Promise<SourceFetchResult> {
  return runActor(
    'indeed_il',
    process.env.APIFY_INDEED_IL_ACTOR_ID,
    {
      country: 'IL',
      location: params.location,
      maxItems: params.limit,
    },
    (item): RawListing | null => {
      const externalId = String(item.id ?? item.jobKey ?? item.url ?? '');
      const url = String(item.url ?? item.jobUrl ?? '');
      const title = String(item.positionName ?? item.title ?? '');
      if (!externalId || !url || !title) return null;

      const description = String(item.description ?? '');
      const requirements = Array.isArray(item.requirements)
        ? item.requirements.map(String)
        : [];

      return {
        source: 'indeed_il',
        externalId,
        url,
        title,
        company: String(item.company ?? ''),
        location: String(item.location ?? params.location),
        postedAt: item.postedAt ? String(item.postedAt) : item.postingDateParsed ? String(item.postingDateParsed) : null,
        description,
        requirements,
        rawText: buildRawText(description, requirements),
      };
    }
  );
}
