import { runActor, buildRawText } from './apifyRunner';
import { extractListItems } from './extractRequirements';
import { DEMO_ACTOR_FAULTS } from '@/lib/demo/faults';
import type { RawListing, SourceFetchParams, SourceFetchResult } from './types';

/**
 * LinkedIn via curious_coder/linkedin-jobs-scraper on Apify, filtered to Israel — field
 * names verified against the actor's real dataset output. `companyLogo` gives a usable
 * logo directly. Requirements aren't a separate field — pulled from the `<li>` bullets in
 * descriptionHtml (typically after a "Requirements:" heading).
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
      limitPerSource: params.limit,
    },
    params.limit,
    (item): RawListing | null => {
      const externalId = String(item.id ?? item.link ?? '');
      const url = String(item.link ?? '');
      const title = String(item.title ?? '');
      if (!externalId || !url || !title) return null;

      const description = String(item.descriptionText ?? '');
      const requirements = extractListItems(item.descriptionHtml as string | undefined);

      return {
        source: 'linkedin',
        externalId,
        url,
        title,
        company: String(item.companyName ?? ''),
        companyLogoUrl: item.companyLogo ? String(item.companyLogo) : null,
        location: String(item.location ?? ''),
        postedAt: item.postedAt ? String(item.postedAt) : null,
        description,
        requirements,
        rawText: buildRawText(description, requirements),
      };
    },
    { onRetry: params.onRetry, demo: params.demo ? DEMO_ACTOR_FAULTS.linkedin : undefined }
  );
}
