import styles from './SearchingState.module.css';
import { SOURCE_LABELS, SOURCES } from '@/types/domain';

/**
 * Mock used a 1.7s fixed timer (design reference only). Real navigation here is driven by
 * the /api/search response resolving — see SearchForm — not a timer.
 */
export function SearchingState() {
  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} />
      <h1 className={styles.heading}>Searching for your next role…</h1>
      <div className={styles.checklist}>
        {SOURCES.map((source) => (
          <div key={source}>{SOURCE_LABELS[source]} — checking…</div>
        ))}
        <div>Scoring fit…</div>
      </div>
    </div>
  );
}
