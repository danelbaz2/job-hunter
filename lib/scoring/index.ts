import type { Seniority } from '@/types/domain';
import type { RawListing } from '@/lib/sources/types';
import { scoreLocation, scoreDomain, scoreSeniority } from './deterministic';
import { scoreSkillsFit } from './ai';

export { scoreLocation, scoreDomain, scoreSeniority, scoreSkillsFit };

/**
 * Fixed weights for the overall score. When skillsScore is null (AI failed), weight is
 * redistributed proportionally across the remaining three so the formula still reproduces
 * the same number from the stored sub-scores alone (SPEC.md Part 2, criterion 3).
 */
const WEIGHTS = { location: 0.25, domain: 0.25, seniority: 0.2, skills: 0.3 } as const;

export function computeOverallScore(sub: {
  locationScore: number;
  domainScore: number;
  seniorityScore: number;
  skillsScore: number | null;
}): number {
  const parts: [number, number][] =
    sub.skillsScore === null
      ? [
          [sub.locationScore, WEIGHTS.location],
          [sub.domainScore, WEIGHTS.domain],
          [sub.seniorityScore, WEIGHTS.seniority],
        ]
      : [
          [sub.locationScore, WEIGHTS.location],
          [sub.domainScore, WEIGHTS.domain],
          [sub.seniorityScore, WEIGHTS.seniority],
          [sub.skillsScore, WEIGHTS.skills],
        ];

  const totalWeight = parts.reduce((sum, [, w]) => sum + w, 0);
  const weighted = parts.reduce((sum, [score, w]) => sum + score * w, 0);
  return Math.round(weighted / totalWeight);
}

export interface ScoredListing {
  listing: RawListing;
  locationScore: number;
  domainScore: number;
  seniorityScore: number;
  skillsScore: number | null;
  aiFailed: boolean;
  overallScore: number;
  matchedPoints: { text: string; quote: string }[];
  gapPoints: { text: string; quote: string }[];
}

export async function scoreListing(
  listing: RawListing,
  criteria: { location: string; domains: string[]; seniority: Seniority; resumeText: string }
): Promise<ScoredListing> {
  const locationScore = scoreLocation(criteria.location, listing.location);
  const domainScore = scoreDomain(criteria.domains, listing);
  const seniorityScore = scoreSeniority(criteria.seniority, listing);
  const skills = await scoreSkillsFit(criteria.resumeText, listing);

  const overallScore = computeOverallScore({
    locationScore,
    domainScore,
    seniorityScore,
    skillsScore: skills.skillsScore,
  });

  return {
    listing,
    locationScore,
    domainScore,
    seniorityScore,
    skillsScore: skills.skillsScore,
    aiFailed: skills.aiFailed,
    overallScore,
    matchedPoints: skills.matchedPoints,
    gapPoints: skills.gapPoints,
  };
}
