'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

type ChipProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
> & { selected?: boolean };

export function Chip({ selected, className, children, ...props }: ChipProps) {
  // One-shot pop whenever the chip transitions into "selected" — same pattern as
  // SaveButton: keyed by a bump counter so it replays every time, not just once.
  const [pulse, setPulse] = useState(0);
  const prevSelected = useRef(selected);

  useEffect(() => {
    if (selected && !prevSelected.current) setPulse((p) => p + 1);
    prevSelected.current = selected;
  }, [selected]);

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'rounded-pill border px-5 py-2.5 text-base transition-colors duration-200',
        selected
          ? 'border-accent-500 bg-accent-500/12 text-accent-300'
          : 'border-border text-text/85 hover:border-text/45 hover:bg-text/5',
        className
      )}
      {...props}
    >
      <motion.span
        key={pulse}
        className="inline-block"
        animate={selected ? { scale: [1, 1.16, 1] } : { scale: 1 }}
        transition={{ duration: 0.34, ease: EASE }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
}
