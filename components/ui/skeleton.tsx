import { cn } from '@/lib/utils';

/** Soft opacity breathing, not a color blink or shimmer sweep — see globals.css `skeleton-pulse`. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-md bg-neutral-800 [animation:skeleton-pulse_1.5s_ease-in-out_infinite]', className)}
      {...props}
    />
  );
}
