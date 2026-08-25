'use client';

import { motion } from 'motion/react';

/**
 * Tactile stand-in for a spinning loader icon — three dots breathing in sequence,
 * in currentColor so it works on any button variant (dark-on-light solid included,
 * where the shimmer gradient used elsewhere in the app would lose contrast).
 */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={className} style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}
