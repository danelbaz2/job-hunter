import { runActor, buildRawText } from './apifyRunner';
import { splitRequirementsText } from './extractRequirements';
import { DEMO_ACTOR_FAULTS } from '@/lib/demo/faults';
import type { RawListing, SourceFetchParams, SourceFetchResult } from './types';

/**
 * Drushim.co.il has no official API (checked — see SPEC.md Part 5). Reached only via
 * swerve/drushim-scraper on Apify. Field names below are verified against the actor's real
 * dataset output (not just its input schema) — earlier guesses (`item.location`/`item.area`
 * for location, `item.company`/`item.employerName` for company) don't exist on this actor's
 * output at all, so location silently fell back to the user's own search input, guaranteeing
 * a false 100% location match on every result regardless of the job's real city.
 */
export async function fetchDrushim(params: SourceFetchParams): Promise<SourceFetchResult> {
  return runActor(
    'drushim',
    process.env.APIFY_DRUSHIM_ACTOR_ID,
    {
      searchTerm: params.domains.join(' '),
      maxItems: params.limit,
    },
    params.limit,
    (item): RawListing | null => {
      const externalId = String(item.jobCode ?? item.url ?? '');
      const url = String(item.url ?? '');
      const title = String(item.jobTitle ?? '');
      if (!externalId || !url || !title) return null;

      const description = String(item.description ?? '');
      const requirements = splitRequirementsText(item.requirements as string | undefined);
      const addresses = Array.isArray(item.addresses) ? item.addresses.map(String) : [];
      const regions = Array.isArray(item.regions) ? item.regions.map(String) : [];

      return {
        source: 'drushim',
        externalId,
        url,
        title,
        company: String(item.companyName ?? ''),
        companyLogoUrl: item.companyLogoUrl ? String(item.companyLogoUrl) : null,
        // Real location field is `addresses` (e.g. ["כרמיאל"]) — never fall back to the
        // user's own search input, or every result silently "matches" by construction.
        location: addresses[0] ?? regions[0] ?? '',
        postedAt: item.postedAt ? String(item.postedAt) : null,
        description,
        requirements,
        rawText: buildRawText(description, requirements),
      };
    },
    { onRetry: params.onRetry, onLog: params.onLog, demo: params.demo ? DEMO_ACTOR_FAULTS.drushim : undefined }
  );
}
