'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SearchForm.module.css';
import { SeniorityPicker } from '@/components/SeniorityPicker';
import { DomainChips } from '@/components/DomainChips';
import { ResumeInput, type ResumeMode } from '@/components/ResumeInput';
import { SearchingState } from '@/components/SearchingState';
import { LOCATION_OPTIONS, type Seniority } from '@/types/domain';

export function SearchForm() {
  const router = useRouter();

  const [location, setLocation] = useState<string>(LOCATION_OPTIONS[0]);
  const [seniority, setSeniority] = useState<Seniority>('Mid-Level');
  const [domains, setDomains] = useState<string[]>([]);
  const [resumeMode, setResumeMode] = useState<ResumeMode>('paste');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSearching(true);

    const form = new FormData();
    form.set('location', location);
    form.set('seniority', seniority);
    form.set('domains', JSON.stringify(domains));
    form.set('resumeMode', resumeMode);
    if (resumeMode === 'upload' && resumeFile) {
      form.set('resumeFile', resumeFile);
    } else {
      form.set('resumeText', resumeText);
    }

    try {
      const res = await fetch('/api/search', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Search failed');
        setSearching(false);
        return;
      }
      router.push(`/results?searchId=${data.searchId}`);
    } catch {
      setError('Search failed — please try again.');
      setSearching(false);
    }
  }

  if (searching) return <SearchingState />;

  return (
    <div>
      <h1>Find your next role</h1>
      <p className={styles.intro}>
        Tell us where and what you&apos;re looking for, and share your resume — we&apos;ll search
        Israel&apos;s job platforms and score each listing against your fit.
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label htmlFor="location">Location</label>
            <select
              id="location"
              className={styles.select}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Seniority</label>
            <SeniorityPicker value={seniority} onChange={setSeniority} />
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
