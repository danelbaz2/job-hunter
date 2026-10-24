import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { api } from '../api/client'
import { PageContainer, SectionLabel } from '../components/PageContainer'

export function HomePage() {
  const health = useQuery({ queryKey: ['health'], queryFn: api.health })

  return (
    <PageContainer>
      <div className="animate-fade-in">
        <h1 className="text-4xl tracking-tight sm:text-5xl">Job Hunter</h1>
        <p className="mt-3 max-w-lg text-lg leading-relaxed text-text/60">
          One search across Israel&apos;s job boards, with an honest fit score: every matched and
          missing point is quoted from the listing itself.
        </p>
        <Link
          to="/search"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-pill bg-gradient-to-r from-accent-700 via-accent-500 to-accent-400 px-7 text-base font-medium text-neutral-900 shadow-[0_8px_24px_-6px_rgba(150,138,224,0.55)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        >
          Start a search&nbsp;→
        </Link>
      </div>

      <section className="mt-14 animate-fade-in [animation-delay:80ms]">
        <SectionLabel>System status</SectionLabel>
        <div className="mt-4 rounded-lg border border-border bg-surface p-4 shadow-sm">
          {health.isPending && <p className="text-sm text-text/60">Checking…</p>}
          {health.isError && (
            <p className="text-sm text-tier-low-text">API unreachable. Is the api service running?</p>
          )}
          {health.data && (
            <ul className="space-y-2 text-sm">
              <StatusRow label="API" ok={health.data.status === 'ok'} />
              <StatusRow label="Database" ok={health.data.database === 'ok'} />
            </ul>
          )}
        </div>
      </section>
    </PageContainer>
  )
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-text/85">{label}</span>
      <span
        className={`rounded-pill border px-2.5 py-0.5 text-xs font-medium ${
          ok
            ? 'border-tier-high-border bg-tier-high-bg text-tier-high-text'
            : 'border-tier-low-border bg-tier-low-bg text-tier-low-text'
        }`}
      >
        {ok ? 'ok' : 'unavailable'}
      </span>
    </li>
  )
}
