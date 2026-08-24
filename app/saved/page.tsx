import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSavedJobItems } from '@/lib/db/queries';
import { ResultsGrid } from '@/app/results/ResultsGrid';

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/search');

  const jobs = await getSavedJobItems(session.user.id);

  return (
    <div className="page" style={{ maxWidth: 1500 }}>
      <ResultsGrid jobs={jobs} summary={null} heading="Saved jobs" />
    </div>
  );
}
