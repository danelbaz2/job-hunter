'use client';

import { useState } from 'react';
import styles from './MatchedGapList.module.css';
import { ChevronLeftIcon } from './icons';
import type { MatchPoint } from '@/types/domain';

/**
 * Every point shows its source quote (README/SPEC.md non-negotiable): the API only ever
 * stores points whose quote verified as a verbatim substring of the listing text, so this
 * component can trust what it renders.
 */
function List({ title, points }: { title: string; points: MatchPoint[] }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>
        {title} — {points.length}
      </div>
      {points.map((p, i) => (
        <div key={i} className={styles.point}>
          <div className={styles.claim}>{p.text}</div>
          <div className={styles.quote}>From listing: &quot;{p.quote}&quot;</div>
        </div>
      ))}
    </div>
  );
}

export function MatchedGapList({ matched, gaps }: { matched: MatchPoint[]; gaps: MatchPoint[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button type="button" className={styles.toggle} onClick={() => setExpanded((v) => !v)}>
        <span>
          {matched.length} matched · {gaps.length} gaps
        </span>
        <ChevronLeftIcon className={expanded ? styles.chevronUp : styles.chevronDown} />
      </button>

      {expanded && (
        <div className={styles.details}>
          <List title="Matched" points={matched} />
          <List title="Gaps" points={gaps} />
        </div>
      )}
    </div>
  );
}
