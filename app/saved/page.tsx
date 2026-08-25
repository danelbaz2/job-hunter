import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SavedLoader } from './SavedLoader';
import { PageContainer } from '@/components/ui/page-container';

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/search');

  return (
    <PageContainer wide>
      <SavedLoader />
    </PageContainer>
  );
}
