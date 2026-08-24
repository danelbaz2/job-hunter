import styles from './Pills.module.css';
import { DOMAIN_OPTIONS } from '@/types/domain';

export function DomainChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(domain: string) {
    onChange(value.includes(domain) ? value.filter((d) => d !== domain) : [...value, domain]);
  }

  return (
    <div className={styles.pillRow}>
      {DOMAIN_OPTIONS.map((domain) => (
        <button
          key={domain}
          type="button"
          aria-pressed={value.includes(domain)}
          className={`${styles.tag} ${value.includes(domain) ? styles.tagSelected : ''}`}
          onClick={() => toggle(domain)}
        >
          {domain}
        </button>
      ))}
    </div>
  );
}
