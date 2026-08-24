'use client';

import { useState } from 'react';
import styles from './CollapsibleText.module.css';
import { ChevronLeftIcon } from './icons';

export function CollapsibleList({
  items,
  collapsedCount = 4,
  listClassName,
}: {
  items: string[];
  collapsedCount?: number;
  listClassName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, collapsedCount);
  const hasMore = items.length > collapsedCount;

  return (
    <div style={{ marginBottom: 40 }}>
      <ul className={listClassName}>
        {visible.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      {hasMore && (
        <button type="button" className={styles.toggle} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : `Read more (${items.length - collapsedCount} more)`}
          <ChevronLeftIcon size={14} className={expanded ? styles.chevronUp : styles.chevronDown} />
        </button>
      )}
    </div>
  );
}
