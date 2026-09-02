import { runActor, buildRawText } from './apifyRunner';
import { splitRequirementsText } from './extractRequirements';
import { DEMO_ACTOR_FAULTS } from '@/lib/demo/faults';
import type { RawListing, SourceFetchParams, SourceFetchResult } from './types';

/**
 * AllJobs.co.il has no official API (checked — see conversation history / SPEC.md Part 5).
 * Reached only via unfenced-group/alljobs-co-il-scraper on Apify — field names verified
 * against the actor's real dataset output. `location` and `company` were already correct
 * guesses; `postedAt`/`datePosted` were not (real field is `postedDate`), and `requirements`
 * is a free-text string, not an array.
 */
export async function fetchAllJobs(params: SourceFetchParams): Promise<SourceFetchResult> {
  return runActor(
    'alljobs',
    process.env.APIFY_ALLJOBS_ACTOR_ID,
    {
      searchQuery: params.domains.join(' '),
      maxResults: params.limit,
    },
    params.limit,
    (item): RawListing | null => {
      const externalId = String(item.jobId ?? item.url ?? '');
      const url = String(item.url ?? '');
      const title = String(item.title ?? '');
      if (!externalId || !url || !title) return null;

      const description = String(item.description ?? '');
      const requirements = splitRequirementsText(item.requirements as string | undefined);

      return {
        source: 'alljobs',
        externalId,
        url,
        title,
        company: String(item.company ?? ''),
        companyLogoUrl: null,
        location: String(item.location ?? ''),
        postedAt: item.postedDate ? String(item.postedDate) : null,
        description,
        requirements,
        rawText: buildRawText(description, requirements),
      };
    },
    { onRetry: params.onRetry, onLog: params.onLog, demo: params.demo ? DEMO_ACTOR_FAULTS.alljobs : undefined }
  );
}
