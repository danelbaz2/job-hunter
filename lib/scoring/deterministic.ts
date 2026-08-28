import type { MatchPoint, Seniority } from '@/types/domain';
import type { RawListing } from '@/lib/sources/types';

/**
 * Deterministic sub-scores (SPEC.md Part 2, criteria 1-2): plain code, not an AI call,
 * so each has one reproducible answer. CLAUDE.md: don't move this into a prompt.
 */

const SENIORITY_KEYWORDS: Record<Seniority, string[]> = {
  Junior: ['junior', 'entry level', 'entry-level', 'graduate'],
  'Mid-Level': ['mid level', 'mid-level', 'intermediate'],
  Senior: ['senior', 'sr.', 'sr '],
  'Team Lead': ['team lead', 'tech lead', 'lead engineer', 'engineering manager'],
};

const ALL_SENIORITY_KEYWORDS = Object.values(SENIORITY_KEYWORDS).flat();

/** Multi-select: a listing fits if it matches ANY of the user's chosen locations — take the best sub-score. */
export function scoreLocation(userLocations: string[], listingLocation: string): number {
  const listing = listingLocation.trim().toLowerCase();
  if (userLocations.length === 0 || !listing) return 50;

  return Math.max(
    ...userLocations.map((loc) => {
      const user = loc.trim().toLowerCase();
      if (!user) return 50;
      if (listing.includes('remote') || user.includes('remote')) return 100;
      if (listing === user || listing.includes(user) || user.includes(listing)) return 100;
      // Same-country-different-city (this project is Israel-scoped, so any non-exact match
      // that isn't clearly a different country still counts as a partial fit — SPEC.md Part 2).
      return 60;
    })
  );
}

export function scoreDomain(userDomains: string[], listing: RawListing): number {
  if (userDomains.length === 0) return 50;
  const haystack = `${listing.title} ${listing.rawText}`.toLowerCase();
  const matches = userDomains.some((d) => haystack.includes(d.toLowerCase()));
  return matches ? 100 : 0;
}

/** Multi-select: a listing fits if it matches ANY of the user's chosen seniority levels. */
export function scoreSeniority(userSeniorities: Seniority[], listing: RawListing): number {
  if (userSeniorities.length === 0) return 50;

  const haystack = `${listing.title} ${listing.rawText}`.toLowerCase();
  const userKeywords = userSeniorities.flatMap((s) => SENIORITY_KEYWORDS[s]);

  if (userKeywords.some((kw) => haystack.includes(kw))) return 100;

  const otherKeywords = ALL_SENIORITY_KEYWORDS.filter((kw) => !userKeywords.includes(kw));
  const conflicts = otherKeywords.some((kw) => haystack.includes(kw));
  if (conflicts) return 0;

  // No seniority stated at all in the listing — neutral, not a penalty.
  return 50;
}

/** First verbatim substring of `listing.rawText` that contains `needle` (case-insensitive),
 * returned with its original casing — so a synthesized point still carries a real quote. */
function findQuote(listing: RawListing, needle: string): string | null {
  if (!needle.trim()) return null;
  const idx = listing.rawText.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return null;
  // Widen to the surrounding line so the quote reads as a phrase, not a bare word.
  const start = listing.rawText.lastIndexOf('\n', idx) + 1;
  let end = listing.rawText.indexOf('\n', idx + needle.length);
  if (end === -1) end = listing.rawText.length;
  return listing.rawText.slice(start, end).trim().slice(0, 200);
}

/**
 * Matched/gap points built from the deterministic sub-scores alone — used when there's no
 * candidate text to run skills-fit against (or the AI call produced nothing), so a listing
 * still never shows an empty explanation (SPEC.md Part 2, criterion 5). Every quote is a
 * verbatim substring of the listing text; a dimension with no real quote is skipped.
 */
export function deterministicPoints(
  criteria: { locations: string[]; domains: string[]; seniorities: Seniority[] },
  listing: RawListing,
  sub: { locationScore: number; domainScore: number; seniorityScore: number }
): { matchedPoints: MatchPoint[]; gapPoints: MatchPoint[] } {
  const matchedPoints: MatchPoint[] = [];
  const gapPoints: MatchPoint[] = [];

  // — location —
  const locQuote =
    criteria.locations.map((l) => findQuote(listing, l)).find(Boolean) ??
    (listing.location.trim() && listing.rawText.includes(listing.location.trim())
      ? listing.location.trim()
      : null);
  if (criteria.locations.length > 0) {
    if (sub.locationScore >= 60 && locQuote) {
      matchedPoints.push({
        text: `Location fits one you selected (${criteria.locations.join(', ')}).`,
        quote: locQuote,
      });
    } else if (sub.locationScore === 0 && locQuote) {
      gapPoints.push({ text: 'Listing location is outside the areas you chose.', quote: locQuote });
    }
  }

  // — domain —
  if (criteria.domains.length > 0) {
    const domainHit = criteria.domains.map((d) => findQuote(listing, d)).find(Boolean);
    if (sub.domainScore === 100 && domainHit) {
      matchedPoints.push({
        text: `Matches your ${criteria.domains.join(' / ')} focus.`,
        quote: domainHit,
      });
    } else if (sub.domainScore === 0) {
      const anyQuote = findQuote(listing, listing.title);
      if (anyQuote) {
        gapPoints.push({
          text: `Listing doesn't clearly mention ${criteria.domains.join(' / ')}.`,
          quote: anyQuote,
        });
      }
    }
  }

  // — seniority —
  const seniorityKw = criteria.seniorities
    .flatMap((s) => SENIORITY_KEYWORDS[s])
    .map((kw) => findQuote(listing, kw))
    .find(Boolean);
  if (criteria.seniorities.length > 0 && sub.seniorityScore === 100 && seniorityKw) {
    matchedPoints.push({
      text: `Seniority matches (${criteria.seniorities.join(', ')}).`,
      quote: seniorityKw,
    });
  }

  return { matchedPoints, gapPoints };
}
