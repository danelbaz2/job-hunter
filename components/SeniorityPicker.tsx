import styles from './Pills.module.css';
import { SENIORITY_OPTIONS, type Seniority } from '@/types/domain';

export function SeniorityPicker({
  value,
  onChange,
}: {
  value: Seniority[];
  onChange: (v: Seniority[]) => void;
}) {
  function toggle(option: Seniority) {
    onChange(value.includes(option) ? value.filter((s) => s !== option) : [...value, option]);
  }

  return (
    <div className={styles.pillRow}>
      {SENIORITY_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value.includes(option)}
          className={`${styles.pill} ${value.includes(option) ? styles.pillSelected : ''}`}
          onClick={() => toggle(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
