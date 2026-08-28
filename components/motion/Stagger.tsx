'use client';

import { AnimatePresence, motion } from 'motion/react';
import type { ReactElement } from 'react';

const CAP_MS = 300;
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Staggered entrance on mount, plus a real FLIP reorder/exit animation afterwards:
 * children are keyed by their own `key` (not index), each item carries `layout` so
 * Motion animates its position when the list is re-sorted or re-filtered, and
 * AnimatePresence animates items leaving/entering instead of the grid just snapping.
 */
export function Stagger({
  children,
  className,
  perItem = 20,
}: {
  children: ReactElement[];
  className?: string;
  perItem?: number;
}) {
  const step = Math.min(perItem, CAP_MS / Math.max(children.length, 1));

  return (
    <AnimatePresence>
      {children.map((child, i) => (
        <motion.div
          key={child.key ?? i}
          layout
          className={className}
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          // Exit carries its own transition (no stagger delay, quick) — embedding it
          // in the target object overrides the shared `transition` prop below, which
          // only governs the entrance/layout of items that stay on screen.
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.14, ease: 'easeIn' } }}
          transition={{
            layout: { duration: 0.22, ease: EASE },
            opacity: { duration: 0.22, delay: (i * step) / 1000, ease: 'easeOut' },
            y: { duration: 0.22, delay: (i * step) / 1000, ease: 'easeOut' },
            scale: { duration: 0.22, delay: (i * step) / 1000, ease: 'easeOut' },
          }}
        >
          {child}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
