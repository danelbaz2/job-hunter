import { useState } from 'react'
import { OccupationPicker, type OccupationPick } from '../components/OccupationPicker'
import { PageContainer, SectionLabel } from '../components/PageContainer'

export function SearchPage() {
  const [occupations, setOccupations] = useState<OccupationPick[]>([])

  return (
    <PageContainer>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col">
        <div className="animate-fade-in">
          <h1 className="text-4xl tracking-tight sm:text-5xl">Find your next role</h1>
          <p className="mt-3 max-w-lg text-lg leading-relaxed text-text/60">
            Tell us what you&apos;re after, in English or Hebrew, and we&apos;ll search
            Israel&apos;s job boards and score every listing against your fit.
          </p>
        </div>

        {/* Above the sections below, so the suggestion list covers them. */}
        <section className="relative z-10 mt-12 animate-fade-in [animation-delay:50ms]">
          <SectionLabel>What you&apos;re after</SectionLabel>
          <div className="mt-4">
            <OccupationPicker value={occupations} onChange={setOccupations} />
          </div>
        </section>

        <div className="mt-12 h-px bg-border" />

        <section className="mt-12 animate-fade-in [animation-delay:100ms]">
          <SectionLabel>Where &amp; level</SectionLabel>
          <p className="mt-3 text-base text-text/45">
            City and experience level arrive next in phase 1.
          </p>
        </section>

        <div className="mt-14 flex flex-col items-center gap-3 animate-fade-in [animation-delay:150ms]">
          <button
            type="submit"
            disabled
            className="inline-flex h-12 items-center justify-center rounded-pill bg-gradient-to-r from-accent-700 via-accent-500 to-accent-400 px-7 text-base font-medium text-neutral-900 shadow-[0_8px_24px_-6px_rgba(150,138,224,0.55)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:brightness-100"
          >
            Find matching jobs&nbsp;→
          </button>
          <p className="text-center text-xs text-text/40">
            Searching turns on once the search endpoint lands.
          </p>
        </div>
      </form>
    </PageContainer>
  )
}
