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
/** `retrying` is a transient in-flight state shown during a search — never persisted. */
export type SourceProgress = Record<Source, 'pending' | 'ok' | 'failed' | 'retrying'>;

/** One line in the demo failure-scenario activity log (client-side; never persisted). */
export interface SearchLogEntry {
  id: number;
  at: number;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface MatchPoint {
  text: string;
  /** Verbatim substring of the listing's rawText — never fabricated (SPEC.md Part 2, criteria 6-7). */
  quote: string;
}

export interface ResumeSuggestion {
  /** The existing résumé line this rewrites, or null for a bullet grounded in existing content. */
  original: string | null;
  /** Suggested wording — must stay truthful to what's already in the résumé (SPEC.md non-negotiable). */
  suggestion: string;
  /** Why this helps against this listing's stated requirements. */
  rationale: string;
}

export interface SearchResultItem {
  id: string;
  source: Source;
  externalId: string;
  url: string;
  title: string;
  company: string;
  companyLogoUrl: string | null;
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
  /** Null until generated on demand from the job-detail page. */
  resumeSuggestions: ResumeSuggestion[] | null;
  /** Whether the search this listing came from had an actual résumé attached — resume
   * suggestions rewrite existing résumé lines, so free-text intent alone isn't enough. */
  hasResume: boolean;

  saved: boolean;
  applied: boolean;
}

export interface SearchSummary {
  id: string;
  locations: string[];
  seniorities: Seniority[];
  domains: string[];
  sourceStatus: SourceStatus;
  /** Null while scoring is still running for this search. */
  completedAt: string | null;
}
