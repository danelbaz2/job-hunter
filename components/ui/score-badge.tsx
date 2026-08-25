'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function scoreTier(score: number): 'high' | 'mid' | 'low' {
  if (score >= 85) return 'high';
  if (score >= 65) return 'mid';
  return 'low';
}

const TIER_CLASS: Record<'high' | 'mid' | 'low', string> = {
  high: 'text-tier-high-text bg-tier-high-bg border-tier-high-border',
  mid: 'text-tier-mid-text bg-tier-mid-bg border-tier-mid-border',
  low: 'text-tier-low-text bg-tier-low-bg border-tier-low-border',
};

const TIER_STROKE: Record<'high' | 'mid' | 'low', string> = {
  high: 'var(--color-tier-high-text)',
  mid: 'var(--color-tier-mid-text)',
  low: 'var(--color-tier-low-text)',
};

const DETAIL_SIZE = 116;
const DETAIL_STROKE = 7;
const DETAIL_RADIUS = (DETAIL_SIZE - DETAIL_STROKE) / 2;
const DETAIL_CIRCUMFERENCE = 2 * Math.PI * DETAIL_RADIUS;

export function ScoreBadge({ score, size = 'card' }: { score: number; size?: 'card' | 'detail' }) {
  const tier = scoreTier(score);

  if (size === 'card') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-pill border font-bold whitespace-nowrap text-base px-3.5 py-1.5 tabular-nums',
          TIER_CLASS[tier]
        )}
      >
        {score}%
      </span>
    );
  }

  return (
    <span className="relative inline-flex" style={{ width: DETAIL_SIZE, height: DETAIL_SIZE }}>
      <svg width={DETAIL_SIZE} height={DETAIL_SIZE} viewBox={`0 0 ${DETAIL_SIZE} ${DETAIL_SIZE}`} className="-rotate-90">
        <circle
          cx={DETAIL_SIZE / 2}
          cy={DETAIL_SIZE / 2}
          r={DETAIL_RADIUS}
          fill="none"
          stroke="var(--color-neutral-800)"
          strokeWidth={DETAIL_STROKE}
        />
        <motion.circle
          cx={DETAIL_SIZE / 2}
          cy={DETAIL_SIZE / 2}
          r={DETAIL_RADIUS}
          fill="none"
          stroke={TIER_STROKE[tier]}
          strokeWidth={DETAIL_STROKE}
          strokeLinecap="round"
          strokeDasharray={DETAIL_CIRCUMFERENCE}
          initial={{ strokeDashoffset: DETAIL_CIRCUMFERENCE }}
          animate={{ strokeDashoffset: DETAIL_CIRCUMFERENCE * (1 - score / 100) }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className={cn('absolute inset-0 flex flex-col items-center justify-center gap-0.5', TIER_CLASS[tier].split(' ')[0])}>
        <span className="text-3xl font-bold tabular-nums">{score}%</span>
        <span className="text-xs font-normal text-text/60">fit score</span>
      </span>
    </span>
  );
}
