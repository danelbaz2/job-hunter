'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './Results.module.css';
import { JobCard } from '@/components/JobCard';
import { WarningIcon } from '@/components/icons';
import { SOURCE_LABELS, SOURCES, type SearchResultItem, type SearchSummary, type Source } from '@/types/domain';

type SortBy = 'score' | 'date';

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

  const failedSources = summary
    ? (Object.entries(summary.sourceStatus) as [Source, 'ok' | 'failed'][]).filter(([, s]) => s === 'failed')
    : [];

  const visible = jobs
    .filter((j) => sourceFilters[j.source])
    .sort((a, b) =>
      sortBy === 'score'
        ? b.overallScore - a.overallScore
        : (a.postedAt ?? '').localeCompare(b.postedAt ?? '')
    );

  function resetFilters() {
    setSourceFilters(Object.fromEntries(SOURCES.map((s) => [s, true])) as Record<Source, boolean>);
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1>{heading}</h1>
          {summary && (
            <div className={styles.summaryTags}>
              <span className={styles.summaryTag}>{summary.location}</span>
              {summary.domains.length > 0 && (
                <span className={styles.summaryTag}>{summary.domains.join(' · ')}</span>
              )}
              <span className={styles.summaryTag}>{summary.seniority}</span>
            </div>
          )}
        </div>
        {summary && (
          <Link href="/search" className={styles.ghostButton}>
            Edit search
          </Link>
        )}
      </div>

      {failedSources.length > 0 && (
        <div className={styles.banner}>
          <WarningIcon />
          <span>
            Checked {Object.entries(summary!.sourceStatus).filter(([, s]) => s === 'ok').map(([s]) => SOURCE_LABELS[s as Source]).join(', ')}
            {' · '}
            {failedSources.map(([s]) => SOURCE_LABELS[s]).join(', ')} was unavailable this run, so its listings are missing.
          </span>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.sourceRow}>
          {availableSources.map((source) => (
            <button
              key={source}
              className={`${styles.sourceTag} ${sourceFilters[source] ? styles.sourceTagSelected : ''}`}
              onClick={() => setSourceFilters((prev) => ({ ...prev, [source]: !prev[source] }))}
            >
              {SOURCE_LABELS[source]}
            </button>
          ))}
        </div>
        <div className={styles.sortWrap}>
          <span>Sort by:</span>
          <div className={styles.sortControl}>
            <button
              className={`${styles.sortOption} ${sortBy === 'score' ? styles.sortOptionSelected : ''}`}
              onClick={() => setSortBy('score')}
            >
              Fit score
            </button>
            <button
              className={`${styles.sortOption} ${sortBy === 'date' ? styles.sortOptionSelected : ''}`}
              onClick={() => setSortBy('date')}
            >
              Newest
            </button>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p>No listings match these filters</p>
          <button className={styles.resetButton} onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
