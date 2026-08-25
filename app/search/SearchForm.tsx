'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SeniorityPicker } from '@/components/SeniorityPicker';
import { LocationChips } from '@/components/LocationChips';
import { DomainChips } from '@/components/DomainChips';
import { ResumeInput, type ResumeMode } from '@/components/ResumeInput';
import { SearchingState } from '@/components/SearchingState';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/motion/FadeIn';
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (locations.length === 0 || seniorities.length === 0) {
      setError('Pick at least one location and level');
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
            setSourceProgress((prev) => ({ ...prev, [event.source]: event.status }));
          } else if (event.type === 'done') {
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
    <div className="flex h-full flex-col overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <FadeIn className="shrink-0">
        <h1 className="text-3xl sm:text-4xl">Find your next role</h1>
        <p className="mt-2 max-w-2xl text-base text-text/70">
          Tell us where and what you&apos;re looking for, and share your resume — we&apos;ll search
          Israel&apos;s job platforms and score each listing against your fit.
        </p>
      </FadeIn>

      {error && (
        <div className="mt-3 shrink-0 rounded-md border border-tier-low-border bg-tier-low-bg px-3 py-2 text-sm text-tier-low-text">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex min-h-0 flex-1 flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <FadeIn delay={0.06}>
            <label className="mb-2 block text-base font-medium">Location</label>
            <LocationChips value={locations} onChange={setLocations} />
          </FadeIn>

          <FadeIn delay={0.12}>
            <label className="mb-2 block text-base font-medium">Level</label>
            <SeniorityPicker value={seniorities} onChange={setSeniorities} />
          </FadeIn>
        </div>

        <FadeIn delay={0.18} className="shrink-0">
          <label className="mb-2 block text-base font-medium">Domain</label>
          <DomainChips value={domains} onChange={setDomains} />
        </FadeIn>

        <FadeIn delay={0.24} className="flex min-h-0 flex-1 flex-col">
          <label className="mb-2 block shrink-0 text-base font-medium">Resume</label>
          <ResumeInput
            mode={resumeMode}
            onModeChange={setResumeMode}
            file={resumeFile}
            onFileChange={setResumeFile}
            text={resumeText}
            onTextChange={setResumeText}
          />
        </FadeIn>

        <FadeIn delay={0.3} className="flex shrink-0 flex-wrap items-center gap-3">
          <Button type="submit" variant="solid" size="lg">
            Find matching jobs →
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button type="button" variant="ghost" size="sm" onClick={runTestMode} className="border border-dashed border-border">
              Test mode (skip Apify/OpenRouter)
            </Button>
          )}
        </FadeIn>
      </form>
    </div>
  );
}
