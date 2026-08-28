import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserStats } from '@/lib/db/queries';
import { SignOutButton } from './SignOutButton';
import { PageContainer } from '@/components/ui/page-container';
import { SectionHeading } from '@/components/ui/section-heading';
import { ScoreBadge } from '@/components/ui/score-badge';
import { FadeIn } from '@/components/motion/FadeIn';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3.5 text-base last:border-b-0">
      <span className="text-text/60">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const stats = await getUserStats(session.user.id);

  return (
    <PageContainer className="max-w-[560px]">
      <FadeIn>
        <h1 className="text-4xl tracking-tight sm:text-5xl">Settings</h1>

        <div className="mt-12">
          <SectionHeading>Account</SectionHeading>
          <div>
            <Row label="Name" value={session.user.name ?? '—'} />
            <Row label="Email" value={session.user.email ?? '—'} />
          </div>
        </div>

        <div className="mt-14">
          <SectionHeading tone="high">Your activity</SectionHeading>
          <div>
            <Row label="Searches run" value={stats.searchesRun} />
            <Row label="Listings scored" value={stats.listingsScored} />
            <Row label="Saved jobs" value={stats.savedCount} />
            <Row label="Applied to" value={stats.appliedCount} />
            <Row
              label="Average fit score"
              value={stats.avgScore !== null ? <ScoreBadge score={stats.avgScore} /> : '—'}
            />
            <Row
              label="Best fit score"
              value={stats.bestScore !== null ? <ScoreBadge score={stats.bestScore} /> : '—'}
            />
          </div>
        </div>

        <div className="mt-14">
          <SectionHeading>Session</SectionHeading>
          <SignOutButton />
        </div>
      </FadeIn>
    </PageContainer>
  );
}
