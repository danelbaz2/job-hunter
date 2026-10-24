import { useState } from 'react'
import { OccupationPicker, type OccupationPick } from '../components/OccupationPicker'

export function SearchPage() {
  const [occupations, setOccupations] = useState<OccupationPick[]>([])

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
      <OccupationPicker value={occupations} onChange={setOccupations} />
      <p className="text-sm text-muted">
        City, level and running the search come next in phase 1.
      </p>
    </section>
  )
}
