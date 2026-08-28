'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { ScoreBadge, scoreTier } from '@/components/ui/score-badge';
import { Badge } from '@/components/ui/badge';
import { SaveButton } from '@/components/SaveButton';
import { cn } from '@/lib/utils';
import { daysAgoLabel, daysSincePosted } from '@/lib/formatDate';
import { setCachedJob } from '@/lib/jobDetailCache';
import type { SearchResultItem } from '@/types/domain';

const TIER_BAR: Record<'high' | 'mid' | 'low', string> = {
  high: 'bg-tier-high-text',
  mid: 'bg-tier-mid-text',
  low: 'bg-tier-low-text',
};

export function JobCard({ job }: { job: SearchResultItem }) {
  const router = useRouter();
  const [saved, setSaved] = useState(job.saved);
  const [pending, setPending] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const stale = (daysSincePosted(job.postedAt) ?? 0) >= 30;

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    const next = !saved;
    setSaved(next);
    setCachedJob({ ...job, saved: next });
    try {
      const res = await fetch(`/api/jobs/${job.id}/save`, { method: next ? 'POST' : 'DELETE' });
      if (!res.ok) throw new Error('save failed');
      router.refresh(); // updates the nav bar's "Saved (N)" count
    } catch {
      setSaved(!next);
      setCachedJob({ ...job, saved: !next });
      toast.error(next ? 'Could not save job' : 'Could not remove job');
    } finally {
      setPending(false);
    }
  }

  return (
    <Link
      href={`/jobs/${job.id}`}
      onClick={() => setNavigating(true)}
      aria-busy={navigating}
      className={cn(
        'relative flex flex-col gap-3 overflow-hidden rounded-md bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        navigating && 'scale-[0.98] opacity-70'
      )}
    >
      {navigating && (
        <span
          className="pointer-events-none absolute inset-0 rounded-md"
          style={{
            animation: 'glow-pulse 1s ease-in-out infinite',
            boxShadow: 'inset 0 0 0 1px var(--color-accent-500)',
          }}
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {job.companyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.companyLogoUrl} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-800 text-sm text-accent-100">
              {job.company.charAt(0).toUpperCase() || '?'}
            </span>
          )}
          <div>
            <h3 className="text-base leading-tight">{job.title}</h3>
            <div className="text-sm text-text/60">{job.company}</div>
          </div>
        </div>
        <SaveButton saved={saved} onToggle={toggleSave} variant="bare" />
      </div>

      <div className="flex items-center justify-between">
        <span className={cn('text-xs', stale ? 'text-tier-mid-text' : 'text-text/60')}>
          {job.location} · {daysAgoLabel(job.postedAt)}
        </span>
        <ScoreBadge score={job.overallScore} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="accent">{job.matchedPoints.length} matched</Badge>
        <Badge variant="outline">{job.gapPoints.length} gaps</Badge>
        {job.applied && (
          <span className="inline-flex items-center gap-1 rounded-pill bg-tier-high-bg px-2 py-0.5 text-xs text-tier-high-text">
            <Check size={11} /> Applied
          </span>
        )}
        {job.aiFailed && <Badge variant="neutral">Skills-fit unavailable</Badge>}
      </div>

      <div
        className={cn('absolute inset-x-0 bottom-0 h-0.5', TIER_BAR[scoreTier(job.overallScore)])}
        style={{ width: `${job.overallScore}%` }}
        aria-hidden
      />
    </Link>
  );
}
