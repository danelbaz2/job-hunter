import { PageContainer } from '../components/PageContainer'

export function PlaceholderPage({ title, phase }: { title: string; phase: number }) {
  return (
    <PageContainer>
      <div className="animate-fade-in">
        <h1 className="text-4xl tracking-tight sm:text-5xl">{title}</h1>
        <div className="mt-8 rounded-lg border border-dashed border-border px-6 py-10 text-center">
          <p className="text-base text-text/60">Arrives in phase {phase}.</p>
        </div>
      </div>
    </PageContainer>
  )
}
