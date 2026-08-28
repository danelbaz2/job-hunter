'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Save toggle with a one-shot "just saved" animation — the icon pops and fills, and a
 * ring bursts outward — so a save reads as a deliberate, acknowledged action.
 */
export function SaveButton({
  saved,
  onToggle,
  variant = 'full',
}: {
  saved: boolean;
  onToggle: (e: React.MouseEvent) => void;
  variant?: 'full' | 'icon' | 'bare';
}) {
  const [burst, setBurst] = useState(0);
  const prevSaved = useRef(saved);

  useEffect(() => {
    if (saved && !prevSaved.current) setBurst((b) => b + 1);
    prevSaved.current = saved;
  }, [saved]);

  const iconSize = variant === 'full' ? 16 : 18;

  if (variant === 'bare') {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from saved' : 'Save job'}
        className={cn(
          'relative -m-2.5 shrink-0 rounded-full p-2.5 transition-colors active:scale-90',
          saved ? 'text-accent-400' : 'text-neutral-500 hover:text-accent-400'
        )}
      >
        {burst > 0 && (
          <motion.span
            key={burst}
            aria-hidden
            initial={{ opacity: 0.5, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent-400"
          />
        )}
        <motion.span
          animate={saved ? { scale: [1, 1.4, 1], rotate: [0, -10, 0] } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.42, ease: EASE }}
          className="relative flex"
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </motion.span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={saved ? 'Saved — tap to remove' : 'Save this job'}
      className={cn(
        'relative inline-flex h-10 items-center justify-center gap-1.5 overflow-visible rounded-md border text-sm font-medium transition-colors duration-200 active:scale-[0.97]',
        variant === 'full' ? 'px-4' : 'w-10',
        saved
          ? 'border-accent-500 bg-accent-500 text-neutral-900'
          : 'border-border text-text hover:bg-text/7'
      )}
    >
      <span className="relative inline-flex items-center justify-center">
        {burst > 0 && (
          <motion.span
            key={burst}
            aria-hidden
            initial={{ opacity: 0.55, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.6 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="pointer-events-none absolute h-6 w-6 rounded-full border-2 border-accent-400"
          />
        )}
        <motion.span
          animate={saved ? { scale: [1, 1.4, 1], rotate: [0, -10, 0] } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.42, ease: EASE }}
          className="relative flex"
        >
          <Bookmark size={iconSize} fill={saved ? 'currentColor' : 'none'} />
        </motion.span>
      </span>
      {variant === 'full' && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
