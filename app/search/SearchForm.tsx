'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SeniorityPicker } from '@/components/SeniorityPicker';
import { LocationChips } from '@/components/LocationChips';
import { DomainChips } from '@/components/DomainChips';
import { ResumeInput, type ResumeMode } from '@/components/ResumeInput';
import { SearchingState } from '@/components/SearchingState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { FadeIn } from '@/components/motion/FadeIn';
import { cn } from '@/lib/utils';
import { SOURCES, type Seniority, type SourceProgress } from '@/types/domain';

type Stage = 'form' | 'searching';

function initialProgress(): SourceProgress {
  return Object.fromEntries(SOURCES.map((s) => [s, 'pending'])) as SourceProgress;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function SearchForm() {
  const router = useRouter();

  const [locations, setLocations] = useState<string[]>([]);
  const [seniorities, setSeniorities] = useState<Seniority[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [resumeMode, setResumeMode] = useState<ResumeMode>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [sourceProgress, setSourceProgress] = useState<SourceProgress>(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const missingLocation = touched && locations.length === 0;
  const missingSeniority = touched && seniorities.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTouched(true);

    if (locations.length === 0 || seniorities.length === 0) {
      setError('Pick at least one location and level to continue');
      return;
    }

    setSourceProgress(initialProgress());
    setStage('searching');

    const form = new FormData();
    form.set('locations', JSON.stringify(locations));
    form.set('seniorities', JSON.stringify(seniorities));
    form.set('domains', JSON.stringify(domains));
    form.set('resumeMode', resumeMode);
    if (resumeMode === 'upload' && resumeFile) {
      form.set('resumeFile', resumeFile);
    } else {
      form.set('resumeText', resumeText);
    }

    try {
      const res = await fetch('/api/search', { method: 'POST', body: form });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Search failed');
        setStage('form');
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
          if (event.type === 'source') {
            progress[event.source as keyof SourceProgress] = event.status;
            setSourceProgress((prev) => ({ ...prev, [event.source]: event.status }));
            if (sourcingDoneAt === null && SOURCES.every((s) => progress[s] !== 'pending')) {
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
            setError(event.message);
            setStage('form');
            return;
          }
        }
      }
    } catch {
      setError('Search failed — please try again.');
      setStage('form');
    }
  }

  /**
   * Dev-only: exercises the full searching→results UI (badges, then scoring) without
   * spending on Apify/OpenRouter, then lands on whatever search is already in the DB
   * for this account. Never calls /api/search.
   */
  async function runTestMode() {
    setError(null);
    setSourceProgress(initialProgress());
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
        setError(data.error ?? 'Test mode failed');
        setStage('form');
        return;
      }
      router.push(`/results?searchId=${data.searchId}`);
    } catch {
      setError('Test mode failed — please try again.');
      setStage('form');
    }
  }

  if (stage === 'searching') {
    return <SearchingState sourceProgress={sourceProgress} />;
  }

  return (
    <PageContainer className="max-w-3xl">
      <FadeIn>
        <h1 className="text-3xl tracking-tight sm:text-4xl">Find your next role</h1>
        <p className="mt-2 max-w-2xl text-base text-text/70">
          Tell us where and what you&apos;re looking for, and share your resume — we&apos;ll search
          Israel&apos;s job platforms and score each listing against your fit.
        </p>
      </FadeIn>

      {error && (
        <div className="mt-4 rounded-md border border-tier-low-border bg-tier-low-bg px-3 py-2 text-sm text-tier-low-text">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <Card className="gap-5 p-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FadeIn delay={0.06}>
              <div className="mb-2 flex items-baseline justify-between">
                <label className="text-base font-medium">Location</label>
                {missingLocation && <span className="text-xs text-tier-low-text">Choose at least one</span>}
              </div>
              <LocationChips value={locations} onChange={setLocations} />
            </FadeIn>

            <FadeIn delay={0.12}>
              <div className="mb-2 flex items-baseline justify-between">
                <label className="text-base font-medium">Level</label>
                {missingSeniority && <span className="text-xs text-tier-low-text">Choose at least one</span>}
              </div>
              <SeniorityPicker value={seniorities} onChange={setSeniorities} />
            </FadeIn>
          </div>

          <FadeIn delay={0.18}>
            <div className="mb-2 flex items-baseline gap-2">
              <label className="text-base font-medium">Domain</label>
              <span className="text-sm text-text/50">Optional — leave blank for any</span>
            </div>
            <DomainChips value={domains} onChange={setDomains} />
          </FadeIn>
        </Card>

        <FadeIn delay={0.24}>
          <label className="mb-2 block text-base font-medium">Resume</label>
          <Card className={cn('gap-0 p-3', 'h-[280px]')}>
            <ResumeInput
              mode={resumeMode}
              onModeChange={setResumeMode}
              file={resumeFile}
              onFileChange={setResumeFile}
              text={resumeText}
              onTextChange={setResumeText}
            />
          </Card>
        </FadeIn>

        <FadeIn delay={0.3} className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="solid" size="lg" className="w-full sm:w-auto">
              Find matching jobs →
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Button type="button" variant="ghost" size="sm" onClick={runTestMode} className="border border-dashed border-border">
                Test mode (skip Apify/OpenRouter)
              </Button>
            )}
          </div>
          <span className="text-sm text-text/50">Usually takes under a minute</span>
        </FadeIn>
      </form>
    </PageContainer>
  );
}
