import styles from './FitBreakdown.module.css';
import { WarningIcon } from './icons';
import type { SearchResultItem } from '@/types/domain';

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${value}%` }} />
      </div>
      <span className={styles.value}>{value}%</span>
    </div>
  );
}

export function FitBreakdown({ job }: { job: SearchResultItem }) {
  return (
    <div>
      <Bar label="Location" value={job.locationScore} />
      <Bar label="Domain" value={job.domainScore} />
      <Bar label="Seniority" value={job.seniorityScore} />
      {job.skillsScore !== null ? (
        <Bar label="Skills fit" value={job.skillsScore} />
      ) : (
        <div className={styles.warning}>
          <WarningIcon />
          <span>
            Skills-fit scoring was unavailable for this listing (the AI call failed) — no score is
            shown rather than a guessed one.
          </span>
        </div>
      )}
    </div>
  );
}
