'use client';

import { useEffect, useState } from 'react';
import { fetchSavedJobs } from '@/app/saved/actions';
import { getAllCachedJobs } from '@/lib/jobDetailCache';
import type { SearchResultItem } from '@/types/domain';

const g = globalThis as unknown as { __savedJobsCache?: SearchResultItem[] };

/** No real saved-jobs fetch yet this session, but some of those jobs may already be
 * sitting in jobDetailCache from a grid the user looked at (results seeds it for
 * everything visible, saved or not) — use that as an optimistic first paint instead
 * of a guaranteed skeleton. Replaced silently the moment the real fetch resolves. */
function optimisticSavedJobs(): SearchResultItem[] | null {
  const guess = getAllCachedJobs().filter((job) => job.saved);
  return guess.length > 0 ? guess : null;
}

function initialSavedJobs(): SearchResultItem[] | null {
  return g.__savedJobsCache ?? optimisticSavedJobs();
}

export function useSavedJobs() {
  const [jobs, setJobs] = useState<SearchResultItem[] | null>(initialSavedJobs);
  const [loading, setLoading] = useState(() => initialSavedJobs() === null);

  useEffect(() => {
    let cancelled = false;
    // True for a real cache hit AND an optimistic guess — either way there's
    // already something on screen, so this is a silent-revalidate, not a cold load.
    const hadWarmStart = jobs !== null;

    if (!hadWarmStart) {
      setJobs(null);
      setLoading(true);
    }

    async function load() {
      const result = await fetchSavedJobs();
      if (cancelled) return;
      g.__savedJobsCache = result;

      if (hadWarmStart) {
        // Already showing cached or optimistic data — refresh silently so a
        // save/unsave made elsewhere (or an optimistic guess that was off) catches
        // up without flashing a skeleton.
        setJobs(result);
        setLoading(false);
        return;
      }

      setJobs(result);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { jobs, loading };
}
