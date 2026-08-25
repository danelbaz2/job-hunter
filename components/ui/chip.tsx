import { cn } from '@/lib/utils';

export function Chip({
  selected,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'rounded-pill border px-5 py-2.5 text-base transition-all duration-200 active:scale-95',
        selected
          ? 'border-accent-500 bg-accent-500/12 text-accent-300'
          : 'border-border text-text/85 hover:border-text/45 hover:bg-text/5',
        className
      )}
      {...props}
    />
  );
}
