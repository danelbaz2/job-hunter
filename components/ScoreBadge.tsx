import styles from './ScoreBadge.module.css';

export function tierClass(score: number): 'high' | 'mid' | 'low' {
  if (score >= 85) return 'high';
  if (score >= 65) return 'mid';
  return 'low';
}

export function ScoreBadge({ score, size = 'card' }: { score: number; size?: 'card' | 'detail' }) {
  const tier = tierClass(score);
  const sizeClass = size === 'card' ? styles.sizeCard : styles.sizeDetail;

  return (
    <span className={`${styles.badge} ${styles[tier]} ${sizeClass}`}>
      {score}%
      {size === 'detail' && <span className={styles.detailLabel}>fit score</span>}
    </span>
  );
}
