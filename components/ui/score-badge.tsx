import { cn } from '@/lib/utils';

export function scoreTier(score: number): 'high' | 'mid' | 'low' {
  if (score >= 85) return 'high';
  if (score >= 65) return 'mid';
  return 'low';
}

const TIER_CLASS: Record<'high' | 'mid' | 'low', string> = {
  high: 'text-tier-high-text bg-tier-high-bg border-tier-high-border',
  mid: 'text-tier-mid-text bg-tier-mid-bg border-tier-mid-border',
  low: 'text-tier-low-text bg-tier-low-bg border-tier-low-border',
};

export function ScoreBadge({ score, size = 'card' }: { score: number; size?: 'card' | 'detail' }) {
  const tier = scoreTier(score);
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-pill border font-bold whitespace-nowrap',
        TIER_CLASS[tier],
        size === 'card' ? 'text-base px-3.5 py-1.5' : 'flex-col w-[116px] h-[116px] rounded-full text-3xl gap-0.5'
      )}
    >
      {score}%
      {size === 'detail' && <span className="text-xs font-normal opacity-85">fit score</span>}
    </span>
  );
}
