'use client';

import { motion } from 'motion/react';
import { scoreTier } from '@/components/ui/score-badge';
import { cn } from '@/lib/utils';

const TIER_STROKE: Record<'high' | 'mid' | 'low', string> = {
  high: 'var(--color-tier-high-text)',
  mid: 'var(--color-tier-mid-text)',
  low: 'var(--color-tier-low-text)',
};

const SIZE = 64;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RadialMeter({
  label,
  value,
  delay = 0,
  className,
}: {
  label: string;
  value: number;
  delay?: number;
  className?: string;
}) {
  const tier = scoreTier(value);

  return (
    <div className={cn('flex flex-col items-center gap-2 text-center', className)}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-neutral-800)"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={TIER_STROKE[tier]}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - value / 100) }}
          transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        />
        <text
          x={SIZE / 2}
          y={SIZE / 2}
          transform={`rotate(90 ${SIZE / 2} ${SIZE / 2})`}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-text text-[15px] font-semibold tabular-nums"
        >
          {value}
        </text>
      </svg>
      <span className="text-xs text-text/70">{label}</span>
    </div>
  );
}
