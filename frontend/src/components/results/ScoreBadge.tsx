import { tier } from '../../lib/results'

const TIER_CLASSES = {
  high: 'border-tier-high-border bg-tier-high-bg text-tier-high-text',
  mid: 'border-tier-mid-border bg-tier-mid-bg text-tier-mid-text',
  low: 'border-tier-low-border bg-tier-low-bg text-tier-low-text',
} as const

export function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'md' | 'lg' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-pill border font-semibold tabular-nums ${
        TIER_CLASSES[tier(score)]
      } ${size === 'lg' ? 'px-5 py-2 text-3xl' : 'px-3 py-1 text-base'}`}
      aria-label={`Fit score ${score} out of 100`}
    >
      {score}%
    </span>
  )
}
