import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { BoardResult } from '../../api/client'
import { boardLabel } from '../../lib/results'

/**
 * Which boards were searched and what each gave, so a failed or empty board is visible
 * instead of silently missing (SPEC Part 3, Job data).
 */
export function BoardsBanner({ boards }: { boards: BoardResult[] }) {
  const missing = boards.filter((b) => b.status !== 'ok')
  return (
    <section
      aria-label="Boards searched"
      className="flex flex-col gap-3 rounded-lg border border-border bg-neutral-900/60 px-4 py-3"
    >
      <p className="flex items-start gap-2 text-sm text-text/80">
        {missing.length ? (
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-tier-mid-text" />
        ) : (
          <CheckCircle2 size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-tier-high-text" />
        )}
        <span>
          Searched {boards.length} boards
          {missing.length > 0 &&
            ` · ${missing.map((b) => boardLabel(b.board)).join(', ')} gave nothing this time, so ${
              missing.length === 1 ? 'its' : 'their'
            } listings are missing`}
        </span>
      </p>
      <ul className="flex flex-wrap gap-2 text-xs">
        {boards.map((b) => (
          <li
            key={b.board}
            className={`rounded-pill border px-2.5 py-1 ${
              b.status === 'ok'
                ? 'border-border text-text/75'
                : b.status === 'failed'
                  ? 'border-tier-low-border bg-tier-low-bg text-tier-low-text'
                  : 'border-tier-mid-border bg-tier-mid-bg text-tier-mid-text'
            }`}
          >
            {boardLabel(b.board)} ·{' '}
            {b.status === 'failed' ? 'failed' : b.status === 'empty' ? 'none' : b.listings}
          </li>
        ))}
      </ul>
    </section>
  )
}
