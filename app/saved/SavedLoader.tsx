'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useSavedJobs } from '@/lib/savedJobsCache';
import { ResultsGridSkeleton } from '@/components/skeletons/ResultsGridSkeleton';
import { ResultsGrid } from '@/app/results/ResultsGrid';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Same cache-first, 2s-minimum-skeleton pattern as ResultsLoader — see its comment. */
export function SavedLoader() {
  const { jobs, loading } = useSavedJobs();

  return (
    <AnimatePresence mode="wait">
      {loading || !jobs ? (
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
          <ResultsGrid jobs={jobs} summary={null} heading="Saved jobs" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
