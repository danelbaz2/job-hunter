'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { ScoreBadge } from '@/components/ui/score-badge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { daysAgoLabel } from '@/lib/formatDate';
import type { SearchResultItem } from '@/types/domain';

export function JobCard({ job }: { job: SearchResultItem }) {
  const router = useRouter();
  const [saved, setSaved] = useState(job.saved);
  const [pending, setPending] = useState(false);
  const [navigating, setNavigating] = useState(false);

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    const next = !saved;
    setSaved(next);
    try {
      const res = await fetch(`/api/jobs/${job.id}/save`, {
        method: next ? 'POST' : 'DELETE',
      });
      if (!res.ok) throw new Error('save failed');
      router.refresh(); // updates the nav bar's "Saved (N)" count
    } catch {
      setSaved(!next);
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
        'relative flex flex-col gap-3 rounded-md bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
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
        <button
          type="button"
          className={cn(
            '-m-2.5 shrink-0 rounded-full p-2.5 text-neutral-500 transition-colors hover:text-accent-500 active:scale-90',
            saved && 'text-accent-500'
          )}
          onClick={toggleSave}
          aria-label={saved ? 'Remove from saved' : 'Save job'}
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text/60">
          {job.location} · {daysAgoLabel(job.postedAt)}
        </span>
        <ScoreBadge score={job.overallScore} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="accent">{job.matchedPoints.length} matched</Badge>
        <Badge variant="outline">{job.gapPoints.length} gaps</Badge>
        {job.aiFailed && <Badge variant="neutral">Skills-fit unavailable</Badge>}
      </div>
    </Link>
  );
}
