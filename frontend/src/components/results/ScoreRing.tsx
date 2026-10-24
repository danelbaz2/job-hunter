import { tier } from '../../lib/results'

const STROKES = {
  high: 'var(--color-tier-high-text)',
  mid: 'var(--color-tier-mid-text)',
  low: 'var(--color-tier-low-text)',
} as const

/** The overall score as a ring that fills to the score, in its tier's color. */
export function ScoreRing({ score }: { score: number }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const color = STROKES[tier(score)]
  return (
    <div
      className="relative grid h-28 w-28 shrink-0 place-items-center"
      role="img"
      aria-label={`Fit score ${score} out of 100`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-neutral-800)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="flex flex-col items-center leading-none">
        <span className="font-heading text-3xl font-medium tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="mt-1 text-[11px] tracking-[0.14em] text-text/50 uppercase">fit</span>
      </div>
    </div>
  )
}
