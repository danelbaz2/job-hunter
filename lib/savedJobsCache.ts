'use client';

import { useEffect, useState } from 'react';
import { fetchSavedJobs } from '@/app/saved/actions';
import type { SearchResultItem } from '@/types/domain';

const g = globalThis as unknown as { __savedJobsCache?: SearchResultItem[] };

const MIN_SKELETON_MS = 2000;

export function useSavedJobs() {
  const [jobs, setJobs] = useState<SearchResultItem[] | null>(() => g.__savedJobsCache ?? null);
  const [loading, setLoading] = useState(() => !g.__savedJobsCache);

  useEffect(() => {
    let cancelled = false;
    const hadCache = !!g.__savedJobsCache;
    const startedAt = Date.now();

    if (!hadCache) {
      setJobs(null);
      setLoading(true);
    }

    async function load() {
      const result = await fetchSavedJobs();
      if (cancelled) return;
      g.__savedJobsCache = result;

      if (hadCache) {
        // Already showing cached data — refresh silently so a save/unsave made
        // elsewhere catches up without flashing a skeleton.
        setJobs(result);
        return;
      }

      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_SKELETON_MS - elapsed);
      setTimeout(() => {
        if (!cancelled) {
          setJobs(result);
          setLoading(false);
        }
      }, wait);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { jobs, loading };
}
