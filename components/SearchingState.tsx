import styles from './SearchingState.module.css';
import { SOURCE_LABELS, SOURCES, type SourceProgress } from '@/types/domain';

export function SearchingState({ sourceProgress, scoring }: { sourceProgress: SourceProgress; scoring: boolean }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} />
      <h1 className={styles.heading}>Searching for your next role…</h1>
      <div className={styles.checklist}>
        {SOURCES.map((source) => {
          const status = sourceProgress[source];
          return (
            <div key={source} className={status === 'failed' ? styles.warn : status === 'ok' ? styles.done : undefined}>
              {SOURCE_LABELS[source]} —{' '}
              {status === 'pending' ? 'checking…' : status === 'ok' ? '✓ done' : '⚠ unavailable'}
            </div>
          );
        })}
        <div className={scoring ? styles.done : undefined}>Scoring fit… {scoring ? '✓' : ''}</div>
      </div>
    </div>
  );
}
