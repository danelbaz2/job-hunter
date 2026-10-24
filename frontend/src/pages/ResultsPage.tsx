import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api/client'
import { PageContainer } from '../components/PageContainer'
import { BoardsBanner } from '../components/results/BoardsBanner'
import { JobCard } from '../components/results/JobCard'
import { boardLabel } from '../lib/results'

type Sort = 'fit' | 'newest'

export function ResultsPage() {
  const query = useQuery({ queryKey: ['demo-results'], queryFn: api.demoResults, staleTime: Infinity })
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<Sort>('fit')

  const data = query.data
  const shown = useMemo(() => {
    const kept = (data?.results ?? []).filter((r) => !hidden.has(r.source))
    if (sort === 'fit') return kept // the backend already orders by fit (criterion 4)
    return [...kept].sort((a, b) => (b.posted_at ?? '').localeCompare(a.posted_at ?? ''))
  }, [data, hidden, sort])

  if (query.isPending) {
    return (
      <PageContainer wide>
        <p className="text-text/60">Loading results…</p>
      </PageContainer>
    )
  }
  if (query.isError || !data) {
    return (
      <PageContainer wide>
        <p className="rounded-lg border border-tier-low-border bg-tier-low-bg px-4 py-3 text-tier-low-text">
          Couldn&apos;t load the results. Is the api service running?
        </p>
      </PageContainer>
    )
  }

  const boards = data.boards.filter((b) => b.listings > 0).map((b) => b.board)
  const toggle = (board: string) =>
    setHidden((h) => {
      const next = new Set(h)
      if (next.has(board)) next.delete(board)
      else next.add(board)
      return next
    })

  return (
    <PageContainer wide className="flex flex-col gap-6">
      <header className="flex animate-fade-in flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl tracking-tight sm:text-4xl">
            {data.results.length} matches for your search
          </h1>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            {[data.search.city, ...data.search.occupations, data.search.levels.join(', ')]
              .filter(Boolean)
              .map((tag) => (
                <li key={tag} className="rounded-sm bg-neutral-800 px-2.5 py-1 text-text/85">
                  {tag}
                </li>
              ))}
          </ul>
        </div>
        <Link
          to="/search"
          className="inline-flex min-h-11 items-center self-start text-sm text-accent-400 hover:text-accent-300"
        >
          Edit search
        </Link>
      </header>

      {data.demo && (
        <p className="flex items-start gap-2 rounded-lg border border-accent-500/40 bg-accent-500/10 px-4 py-3 text-sm text-accent-200">
          <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            Demo: real listings recorded from the boards, scored by Job Hunter without the AI
            step, so skills fit isn&apos;t included yet.
          </span>
        </p>
      )}

      <BoardsBanner boards={data.boards} />

      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text/55">Source:</span>
          {boards.map((board) => {
            const on = !hidden.has(board)
            return (
              <button
                key={board}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(board)}
                className={`min-h-11 rounded-pill border px-4 text-sm transition-colors ${
                  on
                    ? 'border-accent-500 bg-accent-500/12 text-accent-300'
                    : 'border-border text-text/60 hover:border-text/45'
                }`}
              >
                {boardLabel(board)}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text/55">Sort by:</span>
          <div className="inline-flex rounded-md border border-border p-0.5" role="group">
            {(['fit', 'newest'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={sort === option}
                onClick={() => setSort(option)}
                className={`min-h-10 rounded-sm px-3 text-sm transition-colors ${
                  sort === option ? 'bg-accent-500/15 text-accent-300' : 'text-text/70 hover:text-text'
                }`}
              >
                {option === 'fit' ? 'Fit score' : 'Newest'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {shown.length ? (
        // auto-rows-fr: every row as tall as the tallest card, so all cards share one size.
        <ul className="grid auto-rows-fr gap-5 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {shown.map((result, i) => (
            <li
              key={result.listing_id}
              // min-w-0: a grid item may otherwise grow to fit its longest line.
              className="flex min-w-0 animate-fade-in"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <JobCard
                result={result}
                to={`/results/demo/${encodeURIComponent(result.listing_id)}`}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-text/70">No listings match these filters.</p>
          <button
            type="button"
            onClick={() => setHidden(new Set())}
            className="min-h-11 rounded-md border border-border px-4 text-sm hover:bg-text/7"
          >
            Reset filters
          </button>
        </div>
      )}
    </PageContainer>
  )
}
