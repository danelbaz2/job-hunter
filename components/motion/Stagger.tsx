'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

const CAP_MS = 300;

export function Stagger({
  children,
  className,
  perItem = 20,
}: {
  children: ReactNode[];
  className?: string;
  perItem?: number;
}) {
  const step = Math.min(perItem, CAP_MS / Math.max(children.length, 1));

  return (
    <>
      {children.map((child, i) => (
        <motion.div
          key={i}
          className={className}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: (i * step) / 1000, ease: 'easeOut' }}
        >
          {child}
        </motion.div>
      ))}
    </>
  );
}
