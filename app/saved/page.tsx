import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSavedJobItems } from '@/lib/db/queries';
import { ResultsGrid } from '@/app/results/ResultsGrid';
import { PageContainer } from '@/components/ui/page-container';

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/search');

  const jobs = await getSavedJobItems(session.user.id);

  return (
    <PageContainer wide>
      <ResultsGrid jobs={jobs} summary={null} heading="Saved jobs" />
    </PageContainer>
  );
}
