'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useSearchResults } from '@/lib/searchResultsCache';
import { ResultsGridSkeleton } from '@/components/skeletons/ResultsGridSkeleton';
import { ResultsGrid } from './ResultsGrid';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Cache hit (tab away and back to an already-fetched search): renders instantly,
 * no skeleton. Cache miss: polls the server action every second until the search's
 * results are readable, holding the skeleton for a 2s minimum (see MIN_SKELETON_MS
 * in lib/searchResultsCache.ts) so it never flashes on a fast connection, then
 * cross-fades into the grid — same pattern as JobDetailLoader for individual jobs.
 */
export function ResultsLoader({ searchId }: { searchId: string }) {
  const { data, loading, notFound } = useSearchResults(searchId);

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-lg">This search couldn&apos;t be found.</p>
        <Link href="/search" className="text-sm text-accent-400 hover:underline underline-offset-2">
          Start a new search
        </Link>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {loading || !data ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <ResultsGridSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <ResultsGrid
            jobs={data.jobs}
            summary={data.summary}
            heading={`${data.jobs.length} matches for your search`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
