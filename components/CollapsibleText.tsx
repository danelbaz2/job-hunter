'use client';

import { useState } from 'react';
import styles from './CollapsibleText.module.css';
import { ChevronLeftIcon } from './icons';

export function CollapsibleText({ text, collapsedLines = 4 }: { text: string; collapsedLines?: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ marginBottom: 40 }}>
      <p
        className={`${styles.text} ${expanded ? '' : styles.clamped}`}
        style={expanded ? undefined : { WebkitLineClamp: collapsedLines }}
      >
        {text}
      </p>
      <button type="button" className={styles.toggle} onClick={() => setExpanded((v) => !v)}>
        {expanded ? 'Show less' : 'Read more'}
        <ChevronLeftIcon size={14} className={expanded ? styles.chevronUp : styles.chevronDown} />
      </button>
    </div>
  );
}
