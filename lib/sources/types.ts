import type { Source } from '@/types/domain';

/** Normalized listing shape every source mapper must produce, regardless of the underlying Apify actor's raw fields. */
export interface RawListing {
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
  /** Full original text (description + requirements) — kept verbatim for AI quote verification. */
  rawText: string;
}

export interface SourceFetchParams {
  location: string;
  domains: string[];
  limit: number;
  /** Fires once per Apify retry for this source (1-based). Wired to the searching-progress UI. */
  onRetry?: (retryNumber: number) => void;
  /** When true, this source runs the scripted demo failure scenario instead of calling Apify. */
  demo?: boolean;
}

export interface SourceFetchResult {
  listings: RawListing[];
  status: 'ok' | 'failed';
}
