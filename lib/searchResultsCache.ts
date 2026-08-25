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

const MIN_SKELETON_MS = 2000;
const POLL_INTERVAL_MS = 1000;
const POLL_MAX_ATTEMPTS = 10;

export function useSearchResults(searchId: string) {
  const [data, setData] = useState<SearchResultsPayload | null>(() => cache.get(searchId) ?? null);
  const [loading, setLoading] = useState(() => !cache.has(searchId));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hadCache = cache.has(searchId);
    const startedAt = Date.now();

    if (!hadCache) {
      setData(null);
      setLoading(true);
      setNotFound(false);
    }

    async function poll(attempt: number) {
      const result = await fetchSearchResults(searchId);
      if (cancelled) return;

      if (result) {
        cache.set(searchId, result);
        if (hadCache) {
          // Already showing cached data — refresh silently, no skeleton.
          setData(result);
          return;
        }
        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, MIN_SKELETON_MS - elapsed);
        setTimeout(() => {
          if (!cancelled) {
            setData(result);
            setLoading(false);
          }
        }, wait);
        return;
      }

      if (hadCache || attempt >= POLL_MAX_ATTEMPTS) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      setTimeout(() => {
        if (!cancelled) poll(attempt + 1);
      }, POLL_INTERVAL_MS);
    }

    poll(0);
    return () => {
      cancelled = true;
    };
  }, [searchId]);

  return { data, loading, notFound };
}
