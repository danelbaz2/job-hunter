import type { Seniority } from '@/types/domain';
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
