'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './JobCard.module.css';
import { ScoreBadge } from './ScoreBadge';
import { BookmarkIcon } from './icons';
import { daysAgoLabel } from '@/lib/formatDate';
import type { SearchResultItem } from '@/types/domain';

export function JobCard({ job }: { job: SearchResultItem }) {
  const router = useRouter();
  const [saved, setSaved] = useState(job.saved);
  const [pending, setPending] = useState(false);

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
    } finally {
      setPending(false);
    }
  }

  return (
    <Link href={`/jobs/${job.id}`} className={styles.card}>
      <div className={styles.topBar}>
        <button
          type="button"
          className={`${styles.bookmark} ${saved ? styles.bookmarkSaved : ''}`}
          onClick={toggleSave}
          aria-label={saved ? 'Remove from saved' : 'Save job'}
        >
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      <div className={styles.topRow}>
        <div className={styles.identity}>
          {job.companyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.companyLogoUrl} alt="" className={styles.avatarImg} />
          ) : (
            <span className={styles.avatar}>{job.company.charAt(0).toUpperCase() || '?'}</span>
          )}
          <div>
            <h3 className={styles.title}>{job.title}</h3>
            <div className={styles.company}>{job.company}</div>
          </div>
        </div>
        <ScoreBadge score={job.overallScore} />
      </div>

      <div className={styles.meta}>
        {job.location} · {daysAgoLabel(job.postedAt)}
      </div>

      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles.tagAccent}`}>{job.matchedPoints.length} matched</span>
        <span className={`${styles.tag} ${styles.tagOutline}`}>{job.gapPoints.length} gaps</span>
        {job.aiFailed && <span className={`${styles.tag} ${styles.tagNeutral}`}>Skills-fit unavailable</span>}
      </div>
    </Link>
  );
}
