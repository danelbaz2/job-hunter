'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ChevronLeft, ArrowUpRight, Share2, Check, Sparkles, Loader2, AlertTriangle, Lock } from 'lucide-react';
import { FadeIn } from '@/components/motion/FadeIn';
import { ScoreBadge, scoreTier } from '@/components/ui/score-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from '@/components/ui/section-heading';
import { SaveButton } from '@/components/SaveButton';
import { FitBreakdown } from '@/components/FitBreakdown';
import { daysAgoLabel, daysSincePosted } from '@/lib/formatDate';
import { dedupeDescription } from '@/lib/jobText';
import { setCachedJob } from '@/lib/jobDetailCache';
import { cn } from '@/lib/utils';
import { SOURCE_LABELS, type MatchPoint, type ResumeSuggestion, type SearchResultItem } from '@/types/domain';

const EASE = [0.16, 1, 0.3, 1] as const;
const STALE_DAYS = 30;

const BANNER: Record<'high' | 'mid' | 'low', { class: string; text: string }> = {
  high: {
    class: 'border-tier-high-border bg-tier-high-bg text-tier-high-text',
    text: 'Strong match — this role lines up well with what you told us.',
  },
  mid: {
    class: 'border-tier-mid-border bg-tier-mid-bg text-tier-mid-text',
    text: 'Partial match — worth a look, but read the gaps before applying.',
  },
  low: {
    class: 'border-tier-low-border bg-tier-low-bg text-tier-low-text',
    text: "Loose match — several things the listing asks for don't line up yet.",
  },
};

function PointList({ points }: { points: MatchPoint[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {points.map((p, i) => (
        <li key={i} className="rounded-md border border-border bg-surface p-4">
          <p className="text-base leading-relaxed text-text/90">{p.text}</p>
          <p className="mt-2 text-sm italic leading-relaxed text-text/55">
            From the listing: &ldquo;{p.quote}&rdquo;
          </p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Each section lives in its own bordered, height-capped card with its own internal
 * scrollbar — scrolling inside a long list (matched points, requirements, …) never
 * scrolls the rest of the page, and each section reads as a distinct block rather than
 * one continuous stream.
 */
function SectionCard({
  title,
  tone,
  count,
  scroll = true,
  children,
}: {
  title: string;
  tone?: 'accent' | 'high' | 'low';
  count?: number;
  scroll?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <SectionHeading tone={tone} count={count}>
        {title}
      </SectionHeading>
      <div className={scroll ? 'max-h-[380px] overflow-y-auto overflow-x-hidden break-words pr-1' : undefined}>
        {children}
      </div>
    </div>
  );
}

function SuggestionCard({ s }: { s: ResumeSuggestion }) {
  return (
    <li className="rounded-md border border-border bg-surface p-4">
      {s.original && (
        <p className="text-sm leading-relaxed text-text/50 line-through decoration-text/30">{s.original}</p>
      )}
      <p className={cn('text-base leading-relaxed text-text/90', s.original && 'mt-1.5')}>{s.suggestion}</p>
      <p className="mt-2 text-sm leading-relaxed text-accent-200/80">{s.rationale}</p>
    </li>
  );
}

export function JobDetailClient({ job }: { job: SearchResultItem }) {
  const router = useRouter();
  const [saved, setSaved] = useState(job.saved);
  const [applied, setApplied] = useState(job.applied);
  const [suggestions, setSuggestions] = useState<ResumeSuggestion[] | null>(job.resumeSuggestions);
  const [suggestState, setSuggestState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  const tier = scoreTier(job.overallScore);
  const banner = BANNER[tier];
  const ageDays = daysSincePosted(job.postedAt);
  const stale = ageDays !== null && ageDays >= STALE_DAYS;
  // Requirements come back from the source as their own field, but the description
  // frequently already contains the same bullets as prose — strip those lines out so
  // each requirement reads once (in its own section below), not twice.
  const description = dedupeDescription(job.description, job.requirements);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setPinned(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  async function toggleSave() {
    const next = !saved;
    setSaved(next);
    setCachedJob({ ...job, saved: next });
    try {
      const res = await fetch(`/api/jobs/${job.id}/save`, { method: next ? 'POST' : 'DELETE' });
      if (!res.ok) throw new Error('save failed');
      router.refresh();
    } catch {
      setSaved(!next);
      setCachedJob({ ...job, saved: !next });
      toast.error(next ? 'Could not save job' : 'Could not remove job');
    }
  }

  async function setAppliedState(next: boolean) {
    setApplied(next);
    setCachedJob({ ...job, applied: next });
    try {
      const res = await fetch(`/api/jobs/${job.id}/apply`, { method: next ? 'POST' : 'DELETE' });
      if (!res.ok) throw new Error('apply failed');
      router.refresh();
    } catch {
      setApplied(!next);
      setCachedJob({ ...job, applied: !next });
      toast.error('Could not update applied status');
    }
  }

  function onApplyClick() {
    if (!applied) setAppliedState(true); // link still opens the listing in a new tab
  }

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: job.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      /* dismissed / clipboard unavailable */
    }
  }

  async function generateSuggestions() {
    setSuggestState('loading');
    setSuggestError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/suggestions`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setSuggestState('error');
        setSuggestError(data.error ?? 'Could not generate suggestions.');
        return;
      }
      setSuggestions(data.items);
      setSuggestState('idle');
      setCachedJob({ ...job, resumeSuggestions: data.items });
    } catch {
      setSuggestState('error');
      setSuggestError('Could not generate suggestions — please try again.');
    }
  }

  const applyLink = (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onApplyClick}
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-accent-700 via-accent-500 to-accent-400 px-5 text-sm font-medium text-neutral-900 shadow-[0_8px_24px_-8px_rgba(150,138,224,0.6)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
    >
      Apply on {SOURCE_LABELS[job.source]} <ArrowUpRight size={16} />
    </a>
  );

  return (
    <div className="pb-28 sm:pb-16">
      {/* — sticky mini-header (desktop) — */}
      <AnimatePresence>
        {pinned && (
          <motion.div
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="fixed inset-x-0 top-0 z-40 hidden border-b border-border bg-bg/90 backdrop-blur-md sm:block"
          >
            <div className="mx-auto flex max-w-[760px] items-center gap-3 px-4 py-2.5 lg:px-8">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{job.title}</span>
              <ScoreBadge score={job.overallScore} size="card" />
              <SaveButton saved={saved} onToggle={toggleSave} variant="icon" />
              {applyLink}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capped narrower than the page at lg — the three-column grid below uses the
          full wide container, but a full-width hero/banner/actions row at 1280px would
          just look stretched and sparse. Centered (not left-hugging) within that width. */}
      <div className="lg:mx-auto lg:max-w-[1040px]">
        <button
          className="mb-8 flex items-center gap-1 text-sm text-text/60 transition-colors hover:text-text"
          onClick={() => router.back()}
        >
          <ChevronLeft size={16} /> Back to results
        </button>

        {/* — header — */}
        <FadeIn className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          {job.companyLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.companyLogoUrl} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-accent-800 text-lg text-accent-100">
              {job.company.charAt(0).toUpperCase() || '?'}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl leading-tight tracking-tight sm:text-3xl">{job.title}</h1>
            <p className="mt-1.5 text-sm text-text/60">
              {job.company} · {job.location}
            </p>
          </div>
          <div className="hidden shrink-0 sm:block">
            <ScoreBadge score={job.overallScore} size="detail" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="neutral">Full-time</Badge>
          <Badge variant="neutral">Via {SOURCE_LABELS[job.source]}</Badge>
          <Badge variant="neutral">{daysAgoLabel(job.postedAt)}</Badge>
          {applied && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-tier-high-bg px-2.5 py-0.5 text-xs text-tier-high-text">
              <Check size={12} /> Applied
            </span>
          )}
          <span className="ml-auto sm:hidden">
            <ScoreBadge score={job.overallScore} size="card" />
          </span>
        </div>

        <div
          className={cn(
            'inline-flex w-fit max-w-full self-start rounded-lg border px-4 py-3 text-base leading-relaxed',
            banner.class
          )}
        >
          {banner.text}
        </div>

        {stale && (
          <div className="flex w-fit max-w-full items-start gap-2 self-start rounded-lg border border-tier-mid-border bg-tier-mid-bg px-4 py-3 text-sm text-tier-mid-text">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              This listing is {ageDays} days old — it may already be filled. Check the original before
              spending time on it.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          {applyLink}
          <SaveButton saved={saved} onToggle={toggleSave} />
          <Button variant="secondary" size="icon" onClick={share} aria-label="Share this job">
            <Share2 size={16} />
          </Button>
        </div>
        <div className="-mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text/45">
          <span>Apply opens the original listing in a new tab.</span>
          {applied ? (
            <button type="button" className="underline underline-offset-2 hover:text-text/70" onClick={() => setAppliedState(false)}>
              Mark as not applied
            </button>
          ) : (
            <button type="button" className="underline underline-offset-2 hover:text-text/70" onClick={() => setAppliedState(true)}>
              I&apos;ve already applied
            </button>
          )}
        </div>
        </FadeIn>

        <div ref={sentinelRef} aria-hidden className="h-px" />
      </div>

      {/*
        — sections —
        Three plain grid cells in one row at lg: requirements (left) | main (middle,
        unchanged flow) | matches (right). Each is a single wrapper element AND carries an
        explicit `lg:row-start-1` — verified against the real compiled CSS that without it,
        auto-placement (no explicit row) doesn't reliably keep a later-in-DOM, earlier-in-
        column item (Requirements, column 1, last in the DOM) on the same row as the items
        placed before it — it silently drops to a new row below the tall middle column,
        leaving column 1 blank up top. Explicit row-start sidesteps the auto-placement
        heuristics entirely instead of relying on them.
        Below lg there's a single grid column, so these three items just stack in DOM order.

        Every section is its own SectionCard: a bordered block with its own capped height
        and internal scrollbar, so scrolling a long list (requirements, matched points, …)
        never scrolls the rest of the page, and each section reads as a distinct block
        rather than one continuous stream.
      */}
      <div className="mt-14 grid grid-cols-1 items-start gap-y-14 lg:grid-cols-[320px_minmax(0,1fr)_380px] lg:gap-x-10 xl:gap-x-12">
        {/* main column */}
        <FadeIn delay={0.06} className="flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-start-1">
          <SectionCard title="Fit breakdown" scroll={false}>
            <FitBreakdown job={job} />
          </SectionCard>

          {description.length > 0 && (
            <SectionCard title="Job description">
              <p className="whitespace-pre-line text-lg leading-[1.75] text-text/85">{description}</p>
            </SectionCard>
          )}

          <SectionCard title="Resume suggestions" count={suggestions?.length ?? undefined} scroll={suggestions !== null && suggestions.length > 0}>
            {!job.hasResume && (
              <div className="flex items-start gap-2.5 rounded-md border border-dashed border-border p-4 text-text/55">
                <Lock size={16} className="mt-0.5 shrink-0" />
                <p className="text-base leading-relaxed">
                  This search didn&apos;t include a résumé, so there&apos;s nothing to rewrite —
                  suggestions edit existing résumé lines, and a free-text description alone doesn&apos;t
                  give us any to work with.{' '}
                  <Link href="/search" className="text-accent-400 underline underline-offset-2 hover:text-accent-300">
                    Start a new search with a résumé
                  </Link>{' '}
                  to unlock this.
                </p>
              </div>
            )}

            {job.hasResume && suggestions === null && suggestState !== 'error' && (
              <div className="rounded-md border border-dashed border-border p-4">
                <p className="text-base leading-relaxed text-text/60">
                  Get 2–4 truthful edits to your résumé, aimed at this listing&apos;s wording — nothing
                  invented, just what&apos;s already there, sharpened.
                </p>
                <button
                  type="button"
                  onClick={generateSuggestions}
                  disabled={suggestState === 'loading'}
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-md border border-accent-500 px-4 text-sm font-medium text-accent-300 transition-colors hover:bg-accent-500/12 disabled:opacity-60"
                >
                  {suggestState === 'loading' ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} /> Generate suggestions
                    </>
                  )}
                </button>
              </div>
            )}

            {suggestState === 'error' && (
              <div className="rounded-md border border-tier-low-border bg-tier-low-bg p-4 text-sm text-tier-low-text">
                {suggestError}
                <button type="button" onClick={generateSuggestions} className="ml-2 underline underline-offset-2">
                  Try again
                </button>
              </div>
            )}

            {suggestions !== null && suggestions.length === 0 && (
              <p className="rounded-md border border-dashed border-border p-4 text-base leading-relaxed text-text/55">
                Nothing to suggest here — your résumé can&apos;t be improved for this listing without
                claiming experience you don&apos;t have, and we won&apos;t do that.
              </p>
            )}

            {suggestions !== null && suggestions.length > 0 && (
              <ul className="flex flex-col gap-3">
                {suggestions.map((s, i) => (
                  <SuggestionCard key={i} s={s} />
                ))}
              </ul>
            )}
          </SectionCard>
        </FadeIn>

        {/* right column — matched/gaps, each its own scrollable card */}
        {(job.matchedPoints.length > 0 || job.gapPoints.length > 0) && (
          <FadeIn delay={0.09} className="flex min-w-0 flex-col gap-6 lg:col-start-3 lg:row-start-1">
            {job.matchedPoints.length > 0 && (
              <SectionCard title="What matches" tone="high" count={job.matchedPoints.length}>
                <PointList points={job.matchedPoints} />
              </SectionCard>
            )}

            {job.gapPoints.length > 0 && (
              <SectionCard title="What's missing" tone="low" count={job.gapPoints.length}>
                <PointList points={job.gapPoints} />
              </SectionCard>
            )}
          </FadeIn>
        )}

        {/* left column — requirements */}
        {job.requirements.length > 0 && (
          <FadeIn delay={0.15} className="min-w-0 lg:col-start-1 lg:row-start-1">
            <SectionCard title="Requirements">
              <ul className="flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-text/85 marker:text-accent-400">
                {job.requirements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </SectionCard>
          </FadeIn>
        )}
      </div>

      {/* — mobile action bar — */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-surface p-3 sm:hidden">
        <SaveButton saved={saved} onToggle={toggleSave} variant="icon" />
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onApplyClick}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-accent-700 via-accent-500 to-accent-400 px-4 py-2.5 text-sm font-medium text-neutral-900"
        >
          Apply on {SOURCE_LABELS[job.source]} <ArrowUpRight size={16} />
        </a>
      </div>
    </div>
  );
}
