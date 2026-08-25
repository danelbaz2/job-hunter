'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useJobDetail } from '@/lib/jobDetailCache';
import { JobDetailSkeleton } from '@/components/skeletons/JobDetailSkeleton';
import { JobDetailClient } from './JobDetailClient';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Cache hit: the card's data is already in lib/jobDetailCache (seeded by the results/
 * saved grid), so this skips the skeleton and renders instantly with a fluid fade+lift
 * enter. Cache miss: shows the pulsing skeleton for an enforced minimum stretch (see
 * MIN_SKELETON_MS in jobDetailCache.ts) so it never flashes on a fast network, then
 * cross-fades into the real content.
 *
 * Note: this is a fade/scale entrance, not a true `layoutId` shared-element morph from
 * the exact card in the grid — Framer Motion's layout animations need both elements
 * mounted in the same continuous tree, and App Router fully unmounts the previous
 * route before this one mounts (the same constraint documented in
 * docs/ui-refactor-plan.md re: template.tsx being enter-only).
 */
export function JobDetailLoader({ id }: { id: string }) {
  const { job, loading, notFound } = useJobDetail(id);

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-lg">This listing couldn&apos;t be found.</p>
        <Link href="/results" className="text-sm text-accent-400 hover:underline underline-offset-2">
          Back to results
        </Link>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {loading || !job ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <JobDetailSkeleton />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <JobDetailClient job={job} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
