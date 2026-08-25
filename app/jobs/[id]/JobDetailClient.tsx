'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, Bookmark, ArrowUpRight } from 'lucide-react';
import { FadeIn } from '@/components/motion/FadeIn';
import { ScoreBadge } from '@/components/ui/score-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FitBreakdown } from '@/components/FitBreakdown';
import { MatchedGapList } from '@/components/MatchedGapList';
import { CollapsibleText } from '@/components/CollapsibleText';
import { CollapsibleList } from '@/components/CollapsibleList';
import { daysAgoLabel } from '@/lib/formatDate';
import { SOURCE_LABELS, type SearchResultItem } from '@/types/domain';

export function JobDetailClient({ job }: { job: SearchResultItem }) {
  const router = useRouter();
  const [saved, setSaved] = useState(job.saved);

  async function toggleSave() {
    const next = !saved;
    setSaved(next);
    try {
      const res = await fetch(`/api/jobs/${job.id}/save`, { method: next ? 'POST' : 'DELETE' });
      if (!res.ok) throw new Error('save failed');
      router.refresh(); // updates the nav bar's "Saved (N)" count
    } catch {
      setSaved(!next);
      toast.error(next ? 'Could not save job' : 'Could not remove job');
    }
  }

  return (
    <div className="pb-24 lg:pb-0">
      <button
        className="mb-6 flex items-center gap-1 text-sm text-text/70 hover:text-text"
        onClick={() => router.back()}
      >
        <ChevronLeft size={16} /> Back to results
      </button>

      <FadeIn className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {job.companyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.companyLogoUrl} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-accent-800 text-lg text-accent-100">
              {job.company.charAt(0).toUpperCase() || '?'}
            </span>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl">{job.title}</h1>
            <div className="mt-1 text-sm text-text/60">
              {job.company} · {job.location}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="neutral">Full-time</Badge>
              <Badge variant="neutral">Via {SOURCE_LABELS[job.source]}</Badge>
              <Badge variant="neutral">{daysAgoLabel(job.postedAt)}</Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <Button variant={saved ? 'solid' : 'secondary'} onClick={toggleSave} className="hidden lg:inline-flex">
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
          </Button>
          <ScoreBadge score={job.overallScore} size="detail" />
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
        <FadeIn delay={0.1}>
          <h2 className="mb-3 text-xl">Fit breakdown</h2>
          <FitBreakdown job={job} />

          <h2 className="mb-3 mt-10 text-xl">About this role</h2>
          <CollapsibleText text={job.description} />

          <h2 className="mb-3 text-xl">Requirements</h2>
          <CollapsibleList items={job.requirements} listClassName="list-disc pl-5" />
        </FadeIn>

        <FadeIn delay={0.18} className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="hidden lg:block">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-accent-500 bg-accent-500 px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-accent-400"
            >
              Apply on {SOURCE_LABELS[job.source]} <ArrowUpRight size={16} />
            </a>
            <div className="mt-2 text-center text-xs text-text/60">Opens the original listing in a new tab</div>
          </div>
          <MatchedGapList matched={job.matchedPoints} gaps={job.gapPoints} />

          <div className="rounded-md border border-dashed border-border p-3 text-sm text-text/60">
            Resume edit suggestions for this listing — coming soon.
          </div>
        </FadeIn>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-surface p-3 lg:hidden">
        <Button variant={saved ? 'solid' : 'secondary'} size="icon" onClick={toggleSave} aria-label={saved ? 'Saved' : 'Save'}>
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </Button>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-accent-500 bg-accent-500 px-4 py-2.5 text-sm font-medium text-neutral-900"
        >
          Apply on {SOURCE_LABELS[job.source]} <ArrowUpRight size={16} />
        </a>
      </div>
    </div>
  );
}
