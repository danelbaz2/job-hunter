import { Chip } from '@/components/ui/chip';
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
    <div className="flex flex-wrap gap-2">
      {LOCATION_OPTIONS.map((location) => (
        <Chip key={location} selected={value.includes(location)} onClick={() => toggle(location)}>
          {location}
        </Chip>
      ))}
    </div>
  );
}
