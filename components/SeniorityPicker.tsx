import { Chip } from '@/components/ui/chip';
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
    <div className="flex flex-wrap gap-2">
      {SENIORITY_OPTIONS.map((option) => (
        <Chip key={option} selected={value.includes(option)} onClick={() => toggle(option)}>
          {option}
        </Chip>
      ))}
    </div>
  );
}
