'use client';

import { useEffect, useState } from 'react';
import { fetchSearchResults } from '@/app/results/actions';
import type { SearchResultItem, SearchSummary } from '@/types/domain';

export interface SearchResultsPayload {
  jobs: SearchResultItem[];
  summary: SearchSummary;
}

/** globalThis-backed, same reasoning as lib/jobDetailCache.ts: guarantees one shared
 * instance across route bundles regardless of chunking. */
const g = globalThis as unknown as { __searchResultsCache?: Map<string, SearchResultsPayload> };
const cache = (g.__searchResultsCache ??= new Map<string, SearchResultsPayload>());

const POLL_INTERVAL_MS = 1000;

export function useSearchResults(searchId: string) {
  const [data, setData] = useState<SearchResultsPayload | null>(() => cache.get(searchId) ?? null);
  const [loading, setLoading] = useState(() => !cache.has(searchId));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hadCache = cache.has(searchId);

    if (!hadCache) {
      setData(null);
      setLoading(true);
      setNotFound(false);
    }

    async function poll() {
      const result = await fetchSearchResults(searchId);
      if (cancelled) return;

      if (result.status === 'not-found') {
        // A real, definitive answer — not "still scoring" — so this is the one
        // case allowed to stop the skeleton without data ever arriving.
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (result.status === 'pending') {
        // Scoring can legitimately take a while (real AI calls, no fixed bound) —
        // keep polling for as long as it takes. Never gives up on its own.
        setTimeout(() => {
          if (!cancelled) poll();
        }, POLL_INTERVAL_MS);
        return;
      }

      const payload: SearchResultsPayload = { jobs: result.jobs, summary: result.summary };
      cache.set(searchId, payload);

      if (hadCache) {
        // Already showing cached data — refresh silently, no skeleton.
        setData(payload);
        return;
      }

      setData(payload);
      setLoading(false);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [searchId]);

  return { data, loading, notFound };
}
