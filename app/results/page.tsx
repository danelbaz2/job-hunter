import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSearchWithResults } from '@/lib/db/queries';
import { ResultsGrid } from './ResultsGrid';

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ searchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/search');

  const { searchId } = await searchParams;
  if (!searchId) redirect('/search');

  const data = await getSearchWithResults(searchId, session.user.id);
  if (!data) redirect('/search');

  return (
    <div className="page" style={{ maxWidth: 1500 }}>
      <ResultsGrid jobs={data.jobs} summary={data.summary} heading={`${data.jobs.length} matches for your search`} />
    </div>
  );
}
