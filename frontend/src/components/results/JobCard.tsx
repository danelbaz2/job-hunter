import { MapPin } from 'lucide-react'
import { Link } from 'react-router'
import type { ListingResult } from '../../api/client'
import { boardLabel, postedLabel, splitPlaces, transitionName } from '../../lib/results'
import { ScoreBadge } from './ScoreBadge'

export function JobCard({ result, to }: { result: ListingResult; to: string }) {
  const matched = result.points.filter((p) => p.kind === 'matched').length
  const gaps = result.points.length - matched
  const posted = postedLabel(result.posted_at)
  const { places } = splitPlaces(result.location)
  const initial = (result.company ?? result.title).trim().charAt(0).toUpperCase()

  return (
    <Link
      to={to}
      // The card morphs into the detail page's header (View Transitions API).
      viewTransition
      style={{ viewTransitionName: transitionName(result.listing_id) }}
      className="group flex h-full w-full min-w-0 flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-accent-600 hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-accent-900 text-lg text-accent-300"
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-lg leading-snug" dir="auto">
            {result.title}
          </h2>
          <p className="mt-0.5 truncate text-sm text-text/55" dir="auto">
            {result.company ?? 'Employer not shown'} · {boardLabel(result.source)}
          </p>
        </div>
        <ScoreBadge score={result.overall_score} />
      </div>

      <p className="flex items-center gap-1.5 text-sm text-text/55">
        <MapPin size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate" dir="auto">
          {places[0] ?? 'Location not given'}
        </span>
        {places.length > 1 && (
          <span className="shrink-0 font-medium text-accent-300">+{places.length - 1}</span>
        )}
        {posted && <span className="shrink-0">· {posted}</span>}
      </p>

      <div className="mt-auto flex flex-wrap gap-2 text-xs font-medium">
        {matched > 0 && (
          <span className="rounded-pill bg-accent-500/15 px-2.5 py-1 text-accent-300">
            {matched} matched
          </span>
        )}
        {gaps > 0 && (
          <span className="rounded-pill border border-border px-2.5 py-1 text-text/70">
            {gaps} {gaps === 1 ? 'gap' : 'gaps'}
          </span>
        )}
        {result.summary && (
          <span className="rounded-pill border border-tier-low-border px-2.5 py-1 text-tier-low-text">
            Nothing matched
          </span>
        )}
        {result.partial_text && (
          <span className="rounded-pill bg-neutral-800 px-2.5 py-1 text-text/70">
            Partial description
          </span>
        )}
      </div>
    </Link>
  )
}
