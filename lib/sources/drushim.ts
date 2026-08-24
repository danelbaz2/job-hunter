import { runActor, buildRawText } from './apifyRunner';
import type { RawListing, SourceFetchParams, SourceFetchResult } from './types';

/**
 * Drushim.co.il has no official API (checked — see SPEC.md Part 5). Reached only via an
 * Apify actor. Field mapping below assumes an actor exposing Drushim's internal JSON fields
 * (title/company/location/description in Hebrew or English) — adjust to match the actor chosen.
 */
export async function fetchDrushim(params: SourceFetchParams): Promise<SourceFetchResult> {
  return runActor(
    'drushim',
    process.env.APIFY_DRUSHIM_ACTOR_ID,
    {
      area: params.location,
      category: params.domains,
      maxItems: params.limit,
    },
    (item): RawListing | null => {
      const externalId = String(item.id ?? item.adId ?? item.url ?? '');
      const url = String(item.url ?? item.link ?? '');
      const title = String(item.title ?? item.jobTitle ?? '');
      if (!externalId || !url || !title) return null;

      const description = String(item.description ?? item.jobDescription ?? '');
      const requirements = Array.isArray(item.requirements)
        ? item.requirements.map(String)
        : [];

      return {
        source: 'drushim',
        externalId,
        url,
        title,
        company: String(item.company ?? item.employerName ?? ''),
        location: String(item.location ?? item.area ?? params.location),
        postedAt: item.publishDate ? String(item.publishDate) : item.postedAt ? String(item.postedAt) : null,
        description,
        requirements,
        rawText: buildRawText(description, requirements),
      };
    }
  );
}
