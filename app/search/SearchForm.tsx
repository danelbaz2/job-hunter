'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { MapPin, SignalHigh, Boxes, AlertCircle } from 'lucide-react';
import { FilterField } from '@/components/FilterField';
import { ResumeInput } from '@/components/ResumeInput';
import { SearchingState } from '@/components/SearchingState';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageContainer } from '@/components/ui/page-container';
import { FadeIn } from '@/components/motion/FadeIn';
import {
  SOURCES,
  LOCATION_OPTIONS,
  SENIORITY_OPTIONS,
  DOMAIN_OPTIONS,
  type Seniority,
  type SourceProgress,
} from '@/types/domain';

type Stage = 'form' | 'searching';

const INTENT_PLACEHOLDER =
  "e.g. I'm a computer science graduate (95 GPA) looking for a software engineer role. 4 years building backend services in Go at a product company, now want something with more system-design ownership.";

function initialProgress(): SourceProgress {
  return Object.fromEntries(SOURCES.map((s) => [s, 'pending'])) as SourceProgress;
}

function initialRetries(): Record<string, number> {
  return Object.fromEntries(SOURCES.map((s) => [s, 0]));
}


function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function SearchForm() {
  const router = useRouter();

  const [locations, setLocations] = useState<string[]>([]);
  const [seniorities, setSeniorities] = useState<Seniority[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [intent, setIntent] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>('form');
  const [sourceProgress, setSourceProgress] = useState<SourceProgress>(initialProgress);
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>(initialRetries);
  const [error, setError] = useState<string | null>(null);
  const [errorPulse, setErrorPulse] = useState(0);
  const [touched, setTouched] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  /** Set an error and draw the user's eye to it — bump the pulse so the message
   * re-mounts (re-runs its shake) and gets scrolled into view, even if the text is
   * unchanged from the last attempt. */
  function raiseError(message: string) {
    setError(message);
    setErrorPulse((p) => p + 1);
  }

  useEffect(() => {
    if (errorPulse > 0) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errorPulse]);

  const selectionSummary = [
    locations.length ? locations.join(', ') : null,
    seniorities.length ? seniorities.join(', ') : null,
    domains.length ? domains.join(', ') : null,
  ].filter(Boolean);

  const anySelected = locations.length > 0 || seniorities.length > 0 || domains.length > 0;

  function clearAll() {
    setLocations([]);
    setSeniorities([]);
    setDomains([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTouched(true);

    if (locations.length === 0 || seniorities.length === 0) {
      raiseError('Pick at least one location and one level to continue.');
      return;
    }

    const form = new FormData();
    form.set('locations', JSON.stringify(locations));
    form.set('seniorities', JSON.stringify(seniorities));
    form.set('domains', JSON.stringify(domains));
    form.set('intentText', intent.trim());

    if (resumeFile) {
      form.set('resumeMode', 'upload');
      form.set('resumeFile', resumeFile);
    } else {
      form.set('resumeMode', 'paste');
      form.set('resumeText', '');
    }

    await runSearchStream(form);
  }

  /**
   * POSTs to /api/search and drives the searching screen off its newline-delimited
   * progress stream. Shared by a normal search and the demo failure scenario — the only
   * difference between them is what's in `form`.
   */
  async function runSearchStream(form: FormData) {
    setError(null);
    setSourceProgress(initialProgress());
    setRetryAttempts(initialRetries());
    setStage('searching');

    try {
      const res = await fetch('/api/search', { method: 'POST', body: form });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setStage('form');
        raiseError(data.error ?? 'Search failed — please try again.');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Mirrors sourceProgress but read synchronously here — setSourceProgress is
      // async React state, so checking it back immediately after setting it would
      // still see the pre-update value.
      const progress = initialProgress();
      let sourcingDoneAt: number | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (!line.trim()) continue;

          const event = JSON.parse(line);
          if (event.type === 'source' && event.status === 'retrying') {
            // Transient Apify failure — the adapter is re-attempting this source.
            progress[event.source as keyof SourceProgress] = 'retrying';
            setSourceProgress((prev) => ({ ...prev, [event.source]: 'retrying' }));
            setRetryAttempts((prev) => ({ ...prev, [event.source]: event.attempt }));
          } else if (event.type === 'source') {
            progress[event.source as keyof SourceProgress] = event.status;
            setSourceProgress((prev) => ({ ...prev, [event.source]: event.status }));
            if (
              sourcingDoneAt === null &&
              SOURCES.every((s) => progress[s] === 'ok' || progress[s] === 'failed')
            ) {
              sourcingDoneAt = Date.now();
            }
          } else if (event.type === 'search-created') {
            // The searchId is available as soon as the search row exists — well
            // before scoring (the slow, AI-bound step) finishes. Stay on the
            // "Scoring fit…" screen for exactly 10s from the moment sourcing
            // finished, then hand off to the results page's own skeleton, which
            // polls for completedAt — rather than blocking here on the full
            // pipeline, which can run long on a slow model response.
            const elapsed = sourcingDoneAt === null ? 0 : Date.now() - sourcingDoneAt;
            const wait = Math.max(0, 10_000 - elapsed);
            if (wait > 0) await delay(wait);
            router.push(`/results?searchId=${event.searchId}`);
            return;
          } else if (event.type === 'error') {
            setStage('form');
            raiseError(event.message);
            return;
          }
        }
      }
    } catch {
      setStage('form');
      raiseError('Search failed — please try again.');
    }
  }

  /**
   * Demo / grading: runs the real /api/search pipeline with a deterministic fault script
   * (see lib/demo/faults.ts) — Apify retries that recover, one source that exhausts its
   * retries and degrades to failed, and a transient OpenRouter failure that retries.
   * No external calls are actually made, so it costs nothing.
   */
  async function runFailureScenario() {
    const form = new FormData();
    form.set('demo', '1');
    form.set('locations', JSON.stringify(locations.length ? locations : ['Tel Aviv']));
    form.set('seniorities', JSON.stringify(seniorities.length ? seniorities : ['Mid-Level']));
    form.set('domains', JSON.stringify(domains.length ? domains : ['Backend']));
    form.set('intentText', intent.trim());
    form.set('resumeMode', 'paste');
    form.set('resumeText', '');
    await runSearchStream(form);
  }

  /**
   * Dev-only: exercises the full searching→results UI (badges, then scoring) without
   * spending on Apify/OpenRouter, then lands on whatever search is already in the DB
   * for this account. Never calls /api/search.
   */
  async function runTestMode() {
    setError(null);
    setSourceProgress(initialProgress());
    setRetryAttempts(initialRetries());
    setStage('searching');

    const order: (keyof SourceProgress)[] = ['alljobs', 'drushim', 'indeed_il', 'linkedin'];
    for (const source of order) {
      await delay(650);
      setSourceProgress((prev) => ({ ...prev, [source]: source === 'indeed_il' ? 'failed' : 'ok' }));
    }

    try {
      await delay(1400);
      const res = await fetch('/api/dev/mock-search');
      const data = await res.json();
      if (!res.ok) {
        setStage('form');
        raiseError(data.error ?? 'Test mode failed');
        return;
      }
      router.push(`/results?searchId=${data.searchId}`);
    } catch {
      setStage('form');
      raiseError('Test mode failed — please try again.');
    }
  }

  if (stage === 'searching') {
    return <SearchingState sourceProgress={sourceProgress} retryAttempts={retryAttempts} />;
  }

  const missingFilters = touched && (locations.length === 0 || seniorities.length === 0);

  return (
    <PageContainer>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <FadeIn>
          <h1 className="text-4xl tracking-tight sm:text-5xl">Find your next role</h1>
          <p className="mt-3 max-w-lg text-lg leading-relaxed text-text/60">
            Set where and what you&apos;re after, tell us a little about yourself, and we&apos;ll
            search Israel&apos;s job boards and score every listing against your fit.
          </p>
        </FadeIn>

        {error && (
          <motion.div
            key={errorPulse}
            ref={errorRef}
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, x: [0, -9, 8, -5, 4, 0] }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mt-8 flex max-w-full items-start gap-2.5 self-start rounded-lg border border-tier-low-border bg-tier-low-bg px-4 py-3 text-base font-medium text-tier-low-text shadow-sm"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* — filters — */}
        <FadeIn delay={0.05} className="mt-12">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-text/45">
              Where &amp; what
            </h2>
            {anySelected && (
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-text/45 transition-colors hover:text-text/80"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <FilterField
              label="Location"
              subtitle="Where you'd work — pick any that fit"
              icon={MapPin}
              options={LOCATION_OPTIONS}
              value={locations}
              onChange={setLocations}
              invalid={missingFilters}
            />
            <FilterField
              label="Level"
              subtitle="One or more experience levels"
              icon={SignalHigh}
              options={SENIORITY_OPTIONS}
              value={seniorities}
              onChange={setSeniorities}
              invalid={missingFilters}
            />
            <FilterField
              label="Domain"
              subtitle="Optional — leave open for any field"
              icon={Boxes}
              options={DOMAIN_OPTIONS}
              value={domains}
              onChange={setDomains}
            />
          </div>

          <p className="mt-3 min-h-5 text-sm text-text/55">
            {selectionSummary.length > 0 ? (
              selectionSummary.join('  ·  ')
            ) : (
              <span className="text-text/35">Nothing selected yet</span>
            )}
          </p>
        </FadeIn>

        <div className="mt-12 h-px bg-border" />

        {/* — intent — */}
        <FadeIn delay={0.1} className="mt-12">
          <label htmlFor="intent" className="text-sm font-medium uppercase tracking-[0.14em] text-text/45">
            In your words
          </label>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-text/60">
            Optional. A sentence or two on what you&apos;re looking for and where you&apos;re coming
            from — we hand it to the matcher to sharpen your score.
          </p>
          <Textarea
            id="intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder={INTENT_PLACEHOLDER}
            className="mt-4 min-h-32 rounded-lg bg-transparent px-4 py-3.5 text-base leading-relaxed"
          />
        </FadeIn>

        <div className="mt-12 h-px bg-border" />

        {/* — resume — */}
        <FadeIn delay={0.15} className="mt-12">
          <div className="flex items-baseline gap-2.5">
            <span className="text-sm font-medium uppercase tracking-[0.14em] text-text/45">Resume</span>
            <span className="text-sm text-text/35">Optional — sharpens the match further</span>
          </div>
          <div className="mt-4 h-[220px]">
            <ResumeInput file={resumeFile} onFileChange={setResumeFile} />
          </div>
        </FadeIn>

        {/* — submit — */}
        <FadeIn delay={0.2} className="mt-14 flex flex-col items-center gap-3">
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-pill bg-gradient-to-r from-accent-700 via-accent-500 to-accent-400 px-7 text-base font-medium text-neutral-900 shadow-[0_8px_24px_-6px_rgba(150,138,224,0.55)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_10px_30px_-6px_rgba(150,138,224,0.7)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Find matching jobs&nbsp;→
          </button>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {process.env.NODE_ENV === 'development' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={runTestMode}
                className="border border-dashed border-border"
              >
                Test mode (skip Apify/OpenRouter)
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={runFailureScenario}
              className="border border-dashed border-tier-low-border text-tier-low-text"
            >
              Run failure scenario
            </Button>
          </div>
          <p className="max-w-sm text-center text-xs text-text/40">
            &ldquo;Run failure scenario&rdquo; drives the real pipeline with simulated Apify
            retries, one source that fails after retrying, and a transient OpenRouter failure —
            no external calls are made.
          </p>
        </FadeIn>
      </form>
    </PageContainer>
  );
}
