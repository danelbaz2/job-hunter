'use client';

import { useState, type ComponentType } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Secrethunter-style filter control: a trigger pill that opens a floating panel of
 * selectable chips. Multi-select; selection count rides on the trigger so the
 * vertical flow shows state without opening anything.
 */
export function FilterField<T extends string>({
  label,
  subtitle,
  icon: Icon,
  options,
  value,
  onChange,
  invalid,
}: {
  label: string;
  subtitle: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const count = value.length;

  function toggle(option: T) {
    onChange(value.includes(option) ? value.filter((o) => o !== option) : [...value, option]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'group inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-base transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/60',
          count > 0
            ? 'border-accent-500/70 bg-accent-500/12 text-accent-200'
            : 'border-border text-text/85 hover:border-text/45 hover:bg-text/5',
          invalid && count === 0 && 'border-tier-low-border text-tier-low-text'
        )}
      >
        <Icon size={15} className={cn('shrink-0', count > 0 ? 'text-accent-300' : 'text-neutral-400')} />
        <span>{label}</span>
        {count > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-accent-500 px-1 text-xs font-medium text-neutral-900">
            {count}
          </span>
        )}
        <ChevronDown
          size={15}
          className={cn(
            'shrink-0 text-neutral-400 transition-transform duration-200',
            open && 'rotate-180',
            count > 0 && 'text-accent-300'
          )}
        />
      </PopoverTrigger>

      <PopoverContent>
        <div className="mb-3 flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface text-accent-300">
            <Icon size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-base font-medium leading-tight text-text">{label}</p>
            <p className="text-sm leading-tight text-text/55">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const selected = value.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(option)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-2 text-sm transition-all duration-150 active:scale-95',
                  selected
                    ? 'border-accent-500 bg-accent-500/15 text-accent-200'
                    : 'border-border text-text/80 hover:border-text/45 hover:bg-text/5'
                )}
              >
                {selected && <Check size={13} className="shrink-0" />}
                {option}
              </button>
            );
          })}
        </div>

        {count > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-3 text-sm text-text/50 transition-colors hover:text-text/80"
          >
            Clear {label.toLowerCase()}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
