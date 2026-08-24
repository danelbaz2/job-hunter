'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './JobDetail.module.css';
import { ScoreBadge } from '@/components/ScoreBadge';
import { FitBreakdown } from '@/components/FitBreakdown';
import { MatchedGapList } from '@/components/MatchedGapList';
import { CollapsibleText } from '@/components/CollapsibleText';
import { CollapsibleList } from '@/components/CollapsibleList';
import { ChevronLeftIcon, BookmarkIcon, ArrowUpRightIcon } from '@/components/icons';
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
    }
  }

  return (
    <div>
      <button className={styles.back} onClick={() => router.back()}>
        <ChevronLeftIcon /> Back to results
      </button>

      <div className={styles.header}>
        <div className={styles.identity}>
          {job.companyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.companyLogoUrl} alt="" className={styles.avatarImg} />
          ) : (
            <span className={styles.avatar}>{job.company.charAt(0).toUpperCase() || '?'}</span>
          )}
          <div>
            <h1 className={styles.title}>{job.title}</h1>
            <div className={styles.subline}>
              {job.company} · {job.location}
            </div>
            <div className={styles.tags}>
              <span className={styles.tag}>Full-time</span>
              <span className={styles.tag}>Via {SOURCE_LABELS[job.source]}</span>
              <span className={styles.tag}>{daysAgoLabel(job.postedAt)}</span>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            className={`${styles.saveButton} ${saved ? styles.saveButtonSaved : ''}`}
            onClick={toggleSave}
          >
            <BookmarkIcon filled={saved} /> {saved ? 'Saved' : 'Save'}
          </button>
          <ScoreBadge score={job.overallScore} size="detail" />
        </div>
      </div>

      <div className={styles.columns}>
        <div>
          <h2 className={styles.h2}>Fit breakdown</h2>
          <FitBreakdown job={job} />

          <h2 className={styles.h2}>About this role</h2>
          <CollapsibleText text={job.description} />

          <h2 className={styles.h2}>Requirements</h2>
          <CollapsibleList items={job.requirements} listClassName={styles.reqList} />
        </div>

        <div className={styles.sticky}>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.applyButton}
          >
            Apply on {SOURCE_LABELS[job.source]} <ArrowUpRightIcon />
          </a>
          <div className={styles.applyCaption}>Opens the original listing in a new tab</div>
          <MatchedGapList matched={job.matchedPoints} gaps={job.gapPoints} />
        </div>
      </div>
    </div>
  );
}
