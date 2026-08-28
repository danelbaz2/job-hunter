'use client';

import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { scoreTier } from '@/components/ui/score-badge';
import { cn } from '@/lib/utils';
import type { SearchResultItem } from '@/types/domain';

const TIER_FILL: Record<'high' | 'mid' | 'low', string> = {
  high: 'bg-tier-high-text',
  mid: 'bg-tier-mid-text',
  low: 'bg-tier-low-text',
};

const TIER_TEXT: Record<'high' | 'mid' | 'low', string> = {
  high: 'text-tier-high-text',
  mid: 'text-tier-mid-text',
  low: 'text-tier-low-text',
};

function Bar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const tier = scoreTier(value);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-text/80">{label}</span>
        <span className={cn('font-semibold tabular-nums', TIER_TEXT[tier])}>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-neutral-800">
        <motion.div
          className={cn('h-full rounded-pill', TIER_FILL[tier])}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export function FitBreakdown({ job }: { job: SearchResultItem }) {
  return (
    <div className="flex flex-col gap-4">
      <Bar label="Location" value={job.locationScore} delay={0} />
      <Bar label="Domain" value={job.domainScore} delay={0.06} />
      <Bar label="Seniority" value={job.seniorityScore} delay={0.12} />
      {job.skillsScore !== null && <Bar label="Skills fit" value={job.skillsScore} delay={0.18} />}

      {job.skillsScore === null && job.aiFailed && (
        <div className="flex items-start gap-2 text-sm text-text/60">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-tier-mid-text" />
          <span>
            Skills-fit scoring was unavailable for this listing (the AI call failed) — no score is
            shown rather than a guessed one.
          </span>
        </div>
      )}
      {job.skillsScore === null && !job.aiFailed && (
        <p className="text-sm text-text/50">
          Skills fit wasn&apos;t scored — this match is on location, domain and seniority only. Add a
          résumé or a note about what you want for a sharper score.
        </p>
      )}
    </div>
  );
}
