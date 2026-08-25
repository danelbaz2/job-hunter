'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Enter-only: AnimatePresence can't hold an unmounting RSC tree across App Router
 * server navigations, so pages fade in but never fade out (ui-refactor-plan.md §3.7).
 * Tuned slower/softer than the plan's original ~200ms per direct user feedback.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 10, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
