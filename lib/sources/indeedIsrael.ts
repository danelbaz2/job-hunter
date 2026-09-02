import { runActor, buildRawText } from './apifyRunner';
import { extractListItems } from './extractRequirements';
import { DEMO_ACTOR_FAULTS } from '@/lib/demo/faults';
import type { RawListing, SourceFetchParams, SourceFetchResult } from './types';

/**
 * Indeed.co.il via misceres/indeed-scraper on Apify, filtered to Israel — field names
 * verified against the actor's real dataset output. `postedAt` is a relative string like
 * "30+ days ago" (unparseable as a date — this is what caused the earlier Invalid Date
 * crash); `postingDateParsed` is the real ISO timestamp and must be preferred over it.
 * Requirements aren't a separate field — pulled from the `<li>` bullets in descriptionHTML.
 */
export async function fetchIndeedIsrael(params: SourceFetchParams): Promise<SourceFetchResult> {
  return runActor(
    'indeed_il',
    process.env.APIFY_INDEED_IL_ACTOR_ID,
    {
      country: 'IL',
      location: params.location,
      position: params.domains.join(' '),
      maxItemsPerSearch: params.limit,
    },
    params.limit,
    (item): RawListing | null => {
      const externalId = String(item.id ?? item.url ?? '');
      const url = String(item.url ?? '');
      const title = String(item.positionName ?? '');
      if (!externalId || !url || !title) return null;

      const description = String(item.description ?? '');
      const requirements = extractListItems(item.descriptionHTML as string | undefined);

      return {
        source: 'indeed_il',
        externalId,
        url,
        title,
        company: String(item.company ?? ''),
        companyLogoUrl: null,
        location: String(item.location ?? ''),
        postedAt: item.postingDateParsed ? String(item.postingDateParsed) : null,
        description,
        requirements,
        rawText: buildRawText(description, requirements),
      };
    },
    { onRetry: params.onRetry, onLog: params.onLog, demo: params.demo ? DEMO_ACTOR_FAULTS.indeed_il : undefined }
  );
}
