import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Globe,
  MapPin,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { api, type ListingResult, type ResultPoint } from '../api/client'
import { PageContainer, SectionLabel } from '../components/PageContainer'
import { CHIP, INTERACTIVE, LocationChip } from '../components/results/LocationChip'
import { ScoreRing } from '../components/results/ScoreRing'
import {
  boardLabel,
  highlightQuotes,
  isQuoted,
  isRtl,
  postedLabel,
  tier,
  transitionName,
} from '../lib/results'

export function JobDetailPage() {
  const { listingId } = useParams()
  const query = useQuery({ queryKey: ['demo-results'], queryFn: api.demoResults, staleTime: Infinity })
  const result = query.data?.results.find((r) => r.listing_id === listingId)

  if (query.isPending) {
    return (
      <PageContainer wide>
        <p className="text-text/60">Loading…</p>
      </PageContainer>
    )
  }
  if (!result) {
    return (
      <PageContainer wide>
        <BackLink />
        <p className="mt-6 text-text/70">This listing isn&apos;t in the results any more.</p>
      </PageContainer>
    )
  }

  const board = boardLabel(result.source)
  const matched = result.points.filter((point) => point.kind === 'matched')
  const gaps = result.points.filter((point) => point.kind === 'gap')

  return (
    // Bottom room on phones for the sticky action bar above the tab bar.
    <PageContainer wide className="flex flex-col gap-8 pb-28 md:pb-14">
      <BackLink />

      <Header result={result} board={board} />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          <FitBreakdown result={result} />
          <ListingText result={result} board={board} />
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
          <ApplyButton url={result.url} board={board} className="hidden md:inline-flex" />
          {result.summary && (
            <p className="flex items-start gap-2 rounded-lg border border-tier-low-border bg-tier-low-bg px-4 py-3 text-sm text-tier-low-text">
              <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              {result.summary}
            </p>
          )}
          <PointList title="What matches" points={matched} kind="matched" />
          <PointList title="Gaps" points={gaps} kind="gap" />
        </aside>
      </div>

      {/* Phones: the main action stays in reach (SPEC Part 3, Mobile first). */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 border-t border-border bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
        <ApplyButton url={result.url} board={board} className="flex w-full" />
      </div>
    </PageContainer>
  )
}

function BackLink() {
  return (
    <Link
      to="/results/demo"
      viewTransition
      className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm text-accent-400 hover:text-accent-300"
    >
      <ArrowLeft size={16} aria-hidden="true" /> Back to results
    </Link>
  )
}

function Header({ result, board }: { result: ListingResult; board: string }) {
  const rtl = isRtl(result.title)
  const posted = postedLabel(result.posted_at)
  const initial = (result.company ?? result.title).trim().charAt(0).toUpperCase()
  return (
    <header
      style={{ viewTransitionName: transitionName(result.listing_id) }}
      // relative z-10: the places list opening from the header covers the sections below.
      className="relative z-10 flex flex-col-reverse gap-6 rounded-lg border border-border bg-gradient-to-br from-surface to-accent-900/40 p-5 shadow-md sm:flex-row sm:items-center sm:p-7"
    >
      <div className="flex min-w-0 flex-1 items-start gap-4" dir={rtl ? 'rtl' : 'ltr'}>
        <span
          aria-hidden="true"
          className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-accent-900 font-heading text-2xl text-accent-300"
        >
          {initial}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight tracking-tight sm:text-3xl">{result.title}</h1>
          <ul className="mt-3 flex flex-wrap items-center gap-x-5" aria-label="About this listing">
            <li className={CHIP}>
              <Building2 size={15} aria-hidden="true" className="shrink-0 text-accent-400" />
              {result.company ? (
                <span dir="auto">{result.company}</span>
              ) : (
                <span className="text-text/45 italic">Employer not shown</span>
              )}
            </li>
            <li>
              <LocationChip location={result.location} />
            </li>
            <li>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open this listing on ${board} (new tab)`}
                className={`${CHIP} ${INTERACTIVE} group`}
              >
                <Globe size={15} aria-hidden="true" className="shrink-0 text-accent-400" />
                <span className="underline-offset-4 group-hover:underline">{board}</span>
                <ExternalLink
                  size={13}
                  aria-hidden="true"
                  className="shrink-0 text-text/40 transition-colors group-hover:text-accent-300"
                />
              </a>
            </li>
            {posted && (
              <li className={CHIP}>
                <CalendarDays size={15} aria-hidden="true" className="shrink-0 text-accent-400" />
                Posted {posted}
              </li>
            )}
          </ul>
          {result.partial_text && (
            <p className="mt-3 text-xs text-text/50" dir="ltr">
              Partial description from {board}
            </p>
          )}
        </div>
      </div>
      <ScoreRing score={result.overall_score} />
    </header>
  )
}

const BAR_COLORS = {
  high: 'bg-tier-high-text',
  mid: 'bg-tier-mid-text',
  low: 'bg-tier-low-text',
} as const

function FitBreakdown({ result }: { result: ListingResult }) {
  const rows: [string, LucideIcon, number | null | undefined][] = [
    ['Location', MapPin, result.sub_scores.location],
    ['Occupation', Briefcase, result.sub_scores.occupation],
    ['Seniority', BarChart3, result.sub_scores.seniority],
    ['Skills fit', Sparkles, result.sub_scores.skills],
  ]
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
      <SectionLabel>Fit breakdown</SectionLabel>
      <dl className="mt-5 flex flex-col gap-5">
        {rows.map(([label, Icon, value]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-neutral-800 text-accent-300">
              <Icon size={17} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-3 text-sm">
                <dt className="font-medium">{label}</dt>
                <dd className="tabular-nums text-text/70">{value == null ? 'not scored' : `${value}%`}</dd>
              </div>
              {value == null ? (
                <p className="mt-1 text-xs text-text/50">
                  Needs the AI step, which this demo doesn&apos;t run. The score uses the other three.
                </p>
              ) : (
                <div className="mt-2 h-2 rounded-pill bg-neutral-800" aria-hidden="true">
                  <div
                    className={`h-2 rounded-pill ${BAR_COLORS[tier(value)]} transition-[width] duration-700`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}

function PointList({
  title,
  points,
  kind,
}: {
  title: string
  points: ResultPoint[]
  kind: 'matched' | 'gap'
}) {
  if (!points.length) return null
  const Icon = kind === 'matched' ? CheckCircle2 : AlertCircle
  const accent = kind === 'matched' ? 'text-tier-high-text' : 'text-tier-mid-text'
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2 className="flex items-center justify-between font-body text-sm font-medium tracking-[0.14em] text-text/45 uppercase">
        {title}
        <span className={`rounded-pill bg-neutral-800 px-2 py-0.5 text-xs tracking-normal ${accent}`}>
          {points.length}
        </span>
      </h2>
      <ul className="mt-4 flex flex-col gap-5">
        {points.map((point) => (
          <li key={point.claim + point.quote} className="flex gap-3">
            <Icon size={18} aria-hidden="true" className={`mt-0.5 shrink-0 ${accent}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-text">{point.claim}</p>
              {/* Every point shows the words it comes from (SPEC criterion 5). */}
              <figure className="relative mt-2 rounded-md bg-neutral-900/70 px-3.5 py-2.5">
                <span
                  aria-hidden="true"
                  className={`absolute -top-2 start-2 font-heading text-2xl leading-none opacity-60 ${accent}`}
                >
                  &ldquo;
                </span>
                <blockquote className="line-clamp-3 text-sm leading-relaxed text-text/65" dir="auto">
                  {point.quote}
                </blockquote>
              </figure>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

const COLLAPSED_CHARS = 600

const UNDERLINES = {
  matched: 'decoration-tier-high-text/70',
  gap: 'decoration-tier-mid-text/70',
} as const

function ListingText({ result, board }: { result: ListingResult; board: string }) {
  const [expanded, setExpanded] = useState(false)
  const long = result.text.length > COLLAPSED_CHARS
  const segments = highlightQuotes(
    result.text,
    result.points.map((p) => p.quote),
  )
  // A quoted passage takes the color of the points quoting it: green when one matches.
  const kindOf = (text: string) =>
    result.points.some((p) => p.kind === 'matched' && text.includes(p.quote)) ? 'matched' : 'gap'
  const kinds = new Set(result.points.map((p) => p.kind))

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>The listing</SectionLabel>
        <ul className="flex gap-4 text-xs text-text/55" aria-label="Underlined passages">
          {kinds.has('matched') && <LegendItem kind="matched" label="matches" />}
          {kinds.has('gap') && <LegendItem kind="gap" label="gaps" />}
        </ul>
      </div>
      {result.partial_text && (
        <p className="mt-2 text-xs text-text/45">
          {board} only gives part of this listing; open it to read the rest.
        </p>
      )}
      <div className="relative mt-4">
        <p
          className={`text-base leading-loose whitespace-pre-line text-text/75 ${
            long && !expanded ? 'max-h-72 overflow-hidden' : ''
          }`}
          dir={isRtl(result.text) ? 'rtl' : 'ltr'}
        >
          {segments.map((s, i) =>
            isQuoted(s) ? (
              <span
                key={i}
                className={`text-text underline decoration-2 underline-offset-[6px] ${
                  UNDERLINES[kindOf(s.text)]
                }`}
              >
                {s.text}
              </span>
            ) : (
              <span key={i}>{s.text}</span>
            ),
          )}
        </p>
        {long && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface to-transparent" />
        )}
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 min-h-11 text-sm text-accent-400 hover:text-accent-300"
        >
          {expanded ? 'Show less' : 'Show the whole listing'}
        </button>
      )}
    </section>
  )
}

function LegendItem({ kind, label }: { kind: 'matched' | 'gap'; label: string }) {
  const bar = kind === 'matched' ? 'bg-tier-high-text/70' : 'bg-tier-mid-text/70'
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden="true" className={`h-0.5 w-4 rounded-pill ${bar}`} />
      {label}
    </li>
  )
}

function ApplyButton({ url, board, className = '' }: { url: string; board: string; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`h-12 items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-accent-700 via-accent-500 to-accent-400 px-6 text-base font-medium text-neutral-900 shadow-[0_8px_24px_-6px_rgba(150,138,224,0.55)] transition-all hover:brightness-110 ${className}`}
    >
      Open on {board}
      <ExternalLink size={16} aria-hidden="true" />
    </a>
  )
}
