import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export function HomePage() {
  const health = useQuery({ queryKey: ['health'], queryFn: api.health })

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Job Hunter v2</h1>
      <p className="text-muted">Scaffold for phase 1. This screen only checks that the stack is wired up.</p>

      <div className="rounded-lg border border-line p-4">
        <h2 className="mb-2 text-sm font-medium text-muted">Backend status</h2>
        {health.isPending && <p>Checking…</p>}
        {health.isError && (
          <p className="text-red-600">API unreachable. Is the api service running?</p>
        )}
        {health.data && (
          <ul className="space-y-1 text-sm">
            <li>API: {health.data.status}</li>
            <li>Database: {health.data.database}</li>
          </ul>
        )}
      </div>
    </section>
  )
}
