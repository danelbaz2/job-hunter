import type { Seniority } from '@/types/domain';
import type { RawListing } from '@/lib/sources/types';
import { scoreLocation, scoreDomain, scoreSeniority, deterministicPoints } from './deterministic';
import { scoreSkillsFit } from './ai';

export { scoreLocation, scoreDomain, scoreSeniority, scoreSkillsFit, deterministicPoints };

/** Merge résumé text and free-text intent into the single candidate description the AI
 * skills-fit call compares against the listing. Either or both may be empty. */
export function buildCandidateText(resumeText: string, intentText: string): string {
  const parts: string[] = [];
  if (resumeText.trim()) parts.push(`RESUME:\n${resumeText.trim()}`);
  if (intentText.trim()) parts.push(`WHAT THEY WANT:\n${intentText.trim()}`);
  return parts.join('\n\n');
}

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
  criteria: {
    locations: string[];
    domains: string[];
    seniorities: Seniority[];
    resumeText: string;
    intentText: string;
    demo?: boolean;
    onLog?: (entry: import('@/lib/demo/faults').DemoLogEntry) => void;
  }
): Promise<ScoredListing> {
  const locationScore = scoreLocation(criteria.locations, listing.location);
  const domainScore = scoreDomain(criteria.domains, listing);
  const seniorityScore = scoreSeniority(criteria.seniorities, listing);

  const candidateText = buildCandidateText(criteria.resumeText, criteria.intentText);
  const skills = await scoreSkillsFit(candidateText, listing, {
    demo: criteria.demo,
    onLog: criteria.onLog,
  });

  const overallScore = computeOverallScore({
    locationScore,
    domainScore,
    seniorityScore,
    skillsScore: skills.skillsScore,
  });

  // Fall back to deterministic-dimension points whenever skills-fit produced no matched
  // point — filter-only search, or an AI call that failed / returned nothing usable — so
  // the listing still carries a real explanation (SPEC.md Part 2, criterion 5).
  let { matchedPoints, gapPoints } = skills;
  if (matchedPoints.length === 0) {
    const det = deterministicPoints(criteria, listing, { locationScore, domainScore, seniorityScore });
    matchedPoints = det.matchedPoints;
    gapPoints = gapPoints.length > 0 ? gapPoints : det.gapPoints;
  }

  return {
    listing,
    locationScore,
    domainScore,
    seniorityScore,
    skillsScore: skills.skillsScore,
    aiFailed: skills.aiFailed,
    overallScore,
    matchedPoints,
    gapPoints,
  };
}
