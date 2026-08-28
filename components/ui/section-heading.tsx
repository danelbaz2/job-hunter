import { cn } from '@/lib/utils';

type Tone = 'accent' | 'high' | 'low';

const TONE: Record<Tone, { text: string; bar: string; rule: string; chip: string }> = {
  accent: {
    text: 'text-accent-200',
    bar: 'bg-accent-500',
    rule: 'border-accent-500/25',
    chip: 'bg-accent-500/18 text-accent-200',
  },
  high: {
    text: 'text-tier-high-text',
    bar: 'bg-tier-high-text',
    rule: 'border-tier-high-border',
    chip: 'bg-tier-high-bg text-tier-high-text',
  },
  low: {
    text: 'text-tier-low-text',
    bar: 'bg-tier-low-text',
    rule: 'border-tier-low-border',
    chip: 'bg-tier-low-bg text-tier-low-text',
  },
};

/** Colored rubric label that introduces each section of the job-detail page. */
export function SectionHeading({
  children,
  tone = 'accent',
  count,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  count?: number;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <div className={cn('mb-5 flex items-center gap-3 border-b pb-2.5', t.rule, className)}>
      <span className={cn('h-6 w-1.5 shrink-0 rounded-pill', t.bar)} aria-hidden />
      <h2 className={cn('text-xl font-semibold tracking-tight', t.text)}>{children}</h2>
      {count !== undefined && (
        <span className={cn('rounded-pill px-2 py-0.5 text-xs font-semibold tabular-nums', t.chip)}>{count}</span>
      )}
    </div>
  );
}
