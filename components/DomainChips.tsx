import { Chip } from '@/components/ui/chip';
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
    <div className="flex flex-wrap gap-2">
      {DOMAIN_OPTIONS.map((domain) => (
        <Chip key={domain} selected={value.includes(domain)} onClick={() => toggle(domain)}>
          {domain}
        </Chip>
      ))}
    </div>
  );
}
