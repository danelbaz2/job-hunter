import styles from './Pills.module.css';
import { SENIORITY_OPTIONS, type Seniority } from '@/types/domain';

export function SeniorityPicker({
  value,
  onChange,
}: {
  value: Seniority;
  onChange: (v: Seniority) => void;
}) {
  return (
    <div className={styles.pillRow} role="radiogroup" aria-label="Seniority">
      {SENIORITY_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          className={`${styles.pill} ${value === option ? styles.pillSelected : ''}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
