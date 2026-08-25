'use client';

import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const layoutId = useId();

  return (
    <div className={cn('relative inline-flex overflow-hidden rounded-md border border-border', className)}>
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative px-3 py-1.5 text-sm transition-colors duration-300',
            i > 0 && 'border-l border-border',
            value === opt.value ? 'text-accent-400' : 'text-text hover:bg-text/7'
          )}
        >
          {value === opt.value && (
            <motion.span
              layoutId={`segmented-${layoutId}`}
              className="absolute inset-0 -z-10 shadow-[inset_0_0_0_1px_var(--color-accent-500)]"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
