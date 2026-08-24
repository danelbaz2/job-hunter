'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SearchForm.module.css';
import { SeniorityPicker } from '@/components/SeniorityPicker';
import { LocationChips } from '@/components/LocationChips';
import { DomainChips } from '@/components/DomainChips';
import { ResumeInput, type ResumeMode } from '@/components/ResumeInput';
import { SearchingState } from '@/components/SearchingState';
import { SOURCES, type Seniority, type SourceProgress } from '@/types/domain';

function initialProgress(): SourceProgress {
  return Object.fromEntries(SOURCES.map((s) => [s, 'pending'])) as SourceProgress;
}

export function SearchForm() {
  const router = useRouter();

  const [locations, setLocations] = useState<string[]>([]);
  const [seniorities, setSeniorities] = useState<Seniority[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [resumeMode, setResumeMode] = useState<ResumeMode>('paste');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [searching, setSearching] = useState(false);
  const [sourceProgress, setSourceProgress] = useState<SourceProgress>(initialProgress);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (locations.length === 0 || seniorities.length === 0) {
      setError('Pick at least one location and seniority level');
      return;
    }

    setSourceProgress(initialProgress());
    setScoring(false);
    setSearching(true);

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
        setSearching(false);
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
          } else if (event.type === 'scoring') {
            setScoring(true);
          } else if (event.type === 'done') {
            router.push(`/results?searchId=${event.searchId}`);
            return;
          } else if (event.type === 'error') {
            setError(event.message);
            setSearching(false);
            return;
          }
        }
      }
    } catch {
      setError('Search failed — please try again.');
      setSearching(false);
    }
  }

  if (searching) return <SearchingState sourceProgress={sourceProgress} scoring={scoring} />;

  return (
    <div>
      <h1 className={styles.h1}>Find your next role</h1>
      <p className={styles.intro}>
        Tell us where and what you&apos;re looking for, and share your resume — we&apos;ll search
        Israel&apos;s job platforms and score each listing against your fit.
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Location</label>
            <LocationChips value={locations} onChange={setLocations} />
          </div>
          <div className={styles.field}>
            <label>Seniority</label>
            <SeniorityPicker value={seniorities} onChange={setSeniorities} />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Domain</div>
          <DomainChips value={domains} onChange={setDomains} />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Resume</div>
          <ResumeInput
            mode={resumeMode}
            onModeChange={setResumeMode}
            file={resumeFile}
            onFileChange={setResumeFile}
            text={resumeText}
            onTextChange={setResumeText}
          />
        </div>

        <button type="submit" className={styles.cta}>
          Find matching jobs →
        </button>
      </form>
    </div>
  );
}
