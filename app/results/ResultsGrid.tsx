'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { SearchX } from 'lucide-react';
import { FadeIn } from '@/components/motion/FadeIn';
import { JobCard } from '@/components/JobCard';
import { seedJobCache } from '@/lib/jobDetailCache';
import { Banner } from '@/components/ui/banner';
import { Chip } from '@/components/ui/chip';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Stagger } from '@/components/motion/Stagger';
import { SOURCE_LABELS, SOURCES, type SearchResultItem, type SearchSummary, type Source } from '@/types/domain';

type SortBy = 'score' | 'date';
type AppliedFilter = 'all' | 'applied' | 'not-applied';

export function ResultsGrid({
  jobs,
  summary,
  heading,
}: {
  jobs: SearchResultItem[];
  summary: SearchSummary | null;
  heading: string;
}) {
  const availableSources = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.source))) as Source[],
    [jobs]
  );
  const [sourceFilters, setSourceFilters] = useState<Record<Source, boolean>>(
    () => Object.fromEntries(SOURCES.map((s) => [s, true])) as Record<Source, boolean>
  );
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [appliedFilter, setAppliedFilter] = useState<AppliedFilter>('all');

  // Every card visible here already carries full detail data — seed the client cache
  // so clicking any of them is a guaranteed cache hit (instant render, no skeleton).
  useEffect(() => {
    seedJobCache(jobs);
  }, [jobs]);

  const failedSources = summary
    ? (Object.entries(summary.sourceStatus) as [Source, 'ok' | 'failed'][]).filter(([, s]) => s === 'failed')
    : [];

  const visible = jobs
    .filter((j) => sourceFilters[j.source])
    .filter((j) => appliedFilter === 'all' || (appliedFilter === 'applied') === j.applied)
    .sort((a, b) =>
      sortBy === 'score'
        ? b.overallScore - a.overallScore
        : (a.postedAt ?? '').localeCompare(b.postedAt ?? '')
    );

  function resetFilters() {
    setSourceFilters(Object.fromEntries(SOURCES.map((s) => [s, true])) as Record<Source, boolean>);
    setAppliedFilter('all');
  }

  return (
    <FadeIn>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl tracking-tight sm:text-3xl">{heading}</h1>
          {summary && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-pill bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200">
                {summary.locations.join(' · ')}
              </span>
              {summary.domains.length > 0 && (
                <span className="rounded-pill bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200">
                  {summary.domains.join(' · ')}
                </span>
              )}
              <span className="rounded-pill bg-neutral-800 px-2.5 py-1 text-xs text-neutral-200">
                {summary.seniorities.join(' · ')}
              </span>
            </div>
          )}
        </div>
        {summary && (
          <Button asChild variant="ghost">
            <Link href="/search">Edit search</Link>
          </Button>
        )}
      </div>

      <AnimatePresence>
        {failedSources.length > 0 && summary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <Banner className="mb-5">
              Checked{' '}
              {Object.entries(summary.sourceStatus)
                .filter(([, s]) => s === 'ok')
                .map(([s]) => SOURCE_LABELS[s as Source])
                .join(', ')}
              {' · '}
              {failedSources.map(([s]) => SOURCE_LABELS[s]).join(', ')} was unavailable this run, so its listings are
              missing.
            </Banner>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {availableSources.map((source) => (
            <Chip
              key={source}
              selected={sourceFilters[source]}
              onClick={() => setSourceFilters((prev) => ({ ...prev, [source]: !prev[source] }))}
            >
              {SOURCE_LABELS[source]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2 text-sm text-text/70">
            <span>Show:</span>
            <SegmentedControl
              options={[
                { value: 'all', label: 'All' },
                { value: 'applied', label: 'Applied' },
                { value: 'not-applied', label: 'Not applied' },
              ]}
              value={appliedFilter}
              onChange={setAppliedFilter}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-text/70">
            <span>Sort by:</span>
            <SegmentedControl
              options={[
                { value: 'score', label: 'Fit score' },
                { value: 'date', label: 'Newest' },
              ]}
              value={sortBy}
              onChange={setSortBy}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {visible.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <EmptyState
              icon={<SearchX size={20} />}
              title="No listings match these filters"
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  Reset filters
                </Button>
              }
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Stagger>{visible.map((job) => <JobCard key={job.id} job={job} />)}</Stagger>
          </motion.div>
        )}
      </AnimatePresence>
    </FadeIn>
  );
}
