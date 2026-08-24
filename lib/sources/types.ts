import type { Source } from '@/types/domain';

/** Normalized listing shape every source mapper must produce, regardless of the underlying Apify actor's raw fields. */
export interface RawListing {
  source: Source;
  externalId: string;
  url: string;
  title: string;
  company: string;
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
}

export interface SourceFetchResult {
  listings: RawListing[];
  status: 'ok' | 'failed';
}
