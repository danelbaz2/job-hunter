'use client';

import { useEffect, useState } from 'react';
import type { SearchResultItem } from '@/types/domain';

/**
 * Backed by globalThis rather than a plain module-level singleton: the results grid
 * and the job-detail loader are separate route bundles, and nothing guarantees
 * webpack/Turbopack dedupes this module into one shared chunk between them — if it
 * doesn't, each bundle gets its own `cache` and nothing would ever look "warm".
 * Attaching to globalThis is the one thing that's actually guaranteed to be a single
 * instance for the life of the tab, regardless of chunking.
 */
const g = globalThis as unknown as { __jobDetailCache?: Map<string, SearchResultItem> };
const cache = (g.__jobDetailCache ??= new Map<string, SearchResultItem>());

export function getCachedJob(id: string): SearchResultItem | null {
  return cache.get(id) ?? null;
}

export function setCachedJob(job: SearchResultItem) {
  cache.set(job.id, job);
}

/** Seed the cache with everything visible in a results/saved grid, so clicking any
 * card the user can already see is a guaranteed cache hit. */
export function seedJobCache(jobs: SearchResultItem[]) {
  for (const job of jobs) cache.set(job.id, job);
}

const MIN_SKELETON_MS = 1800;

export function useJobDetail(id: string) {
  const [job, setJob] = useState<SearchResultItem | null>(() => getCachedJob(id));
  const [loading, setLoading] = useState(() => !getCachedJob(id));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hadCache = !!getCachedJob(id);
    const startedAt = Date.now();

    if (!hadCache) {
      setJob(null);
      setLoading(true);
      setNotFound(false);
    }

    async function load() {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        if (res.status === 404) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        if (!res.ok) throw new Error('fetch failed');
        const data: SearchResultItem = await res.json();
        setCachedJob(data);
        if (cancelled) return;

        if (hadCache) {
          // stale-while-revalidate: already showing cached data — just refresh silently.
          setJob(data);
          return;
        }

        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, MIN_SKELETON_MS - elapsed);
        setTimeout(() => {
          if (!cancelled) {
            setJob(data);
            setLoading(false);
          }
        }, wait);
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { job, loading, notFound };
}
