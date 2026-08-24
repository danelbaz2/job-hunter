import { runActor, buildRawText } from './apifyRunner';
import type { RawListing, SourceFetchParams, SourceFetchResult } from './types';

/**
 * AllJobs.co.il has no official API (checked — see conversation history / SPEC.md Part 5).
 * Reached only via an Apify actor. Actor ID is deployment-configured (SPEC.md: actor choice
 * is ongoing maintenance, not a fixed dependency) — adjust the field mapping below to match
 * whichever actor's output schema is actually in use.
 */
export async function fetchAllJobs(params: SourceFetchParams): Promise<SourceFetchResult> {
  return runActor(
    'alljobs',
    process.env.APIFY_ALLJOBS_ACTOR_ID,
    {
      location: params.location,
      categories: params.domains,
      maxItems: params.limit,
    },
    (item): RawListing | null => {
      const externalId = String(item.id ?? item.jobId ?? item.url ?? '');
      const url = String(item.url ?? item.jobUrl ?? '');
      const title = String(item.title ?? item.jobTitle ?? '');
      if (!externalId || !url || !title) return null;

      const description = String(item.description ?? item.fullDescription ?? '');
      const requirements = Array.isArray(item.requirements)
        ? item.requirements.map(String)
        : [];

      return {
        source: 'alljobs',
        externalId,
        url,
        title,
        company: String(item.company ?? item.companyName ?? ''),
        location: String(item.location ?? params.location),
        postedAt: item.postedAt ? String(item.postedAt) : item.datePosted ? String(item.datePosted) : null,
        description,
        requirements,
        rawText: buildRawText(description, requirements),
      };
    }
  );
}
