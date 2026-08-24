import styles from './Pills.module.css';
import { LOCATION_OPTIONS } from '@/types/domain';

export function LocationChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(location: string) {
    onChange(value.includes(location) ? value.filter((l) => l !== location) : [...value, location]);
  }

  return (
    <div className={styles.pillRow}>
      {LOCATION_OPTIONS.map((location) => (
        <button
          key={location}
          type="button"
          aria-pressed={value.includes(location)}
          className={`${styles.tag} ${value.includes(location) ? styles.tagSelected : ''}`}
          onClick={() => toggle(location)}
        >
          {location}
        </button>
      ))}
    </div>
  );
}
