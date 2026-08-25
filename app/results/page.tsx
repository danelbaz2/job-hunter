import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ResultsLoader } from './ResultsLoader';
import { PageContainer } from '@/components/ui/page-container';

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ searchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/search');

  const { searchId } = await searchParams;
  if (!searchId) redirect('/search');

  return (
    <PageContainer wide>
      <ResultsLoader searchId={searchId} />
    </PageContainer>
  );
}
