export type Seniority = 'Junior' | 'Mid-Level' | 'Senior' | 'Team Lead';

export const SENIORITY_OPTIONS: Seniority[] = ['Junior', 'Mid-Level', 'Senior', 'Team Lead'];

export const DOMAIN_OPTIONS = [
  'Backend',
  'Frontend',
  'Full-Stack',
  'DevOps',
  'Data',
  'Mobile',
  'QA',
  'Product',
] as const;
export type Domain = (typeof DOMAIN_OPTIONS)[number];

export const LOCATION_OPTIONS = [
  'Tel Aviv',
  'Jerusalem',
  'Haifa',
  'Herzliya',
  'Ra\'anana',
  'Be\'er Sheva',
  'Remote',
] as const;

export const SOURCES = ['alljobs', 'drushim', 'indeed_il', 'linkedin'] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
  alljobs: 'AllJobs',
  drushim: 'Drushim',
  indeed_il: 'Indeed-Israel',
  linkedin: 'LinkedIn',
};

export type SourceStatus = Record<Source, 'ok' | 'failed'>;

export interface MatchPoint {
  text: string;
  /** Verbatim substring of the listing's rawText — never fabricated (SPEC.md Part 2, criteria 6-7). */
  quote: string;
}

export interface SearchResultItem {
  id: string;
  source: Source;
  externalId: string;
  url: string;
  title: string;
  company: string;
  location: string;
  postedAt: string | null;
  description: string;
  requirements: string[];
  rawText: string;

  locationScore: number;
  domainScore: number;
  seniorityScore: number;
  skillsScore: number | null;
  aiFailed: boolean;
  overallScore: number;

  matchedPoints: MatchPoint[];
  gapPoints: MatchPoint[];

  saved: boolean;
}

export interface SearchSummary {
  id: string;
  location: string;
  seniority: Seniority;
  domains: string[];
  sourceStatus: SourceStatus;
}
