import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { JobDetailLoader } from './JobDetailLoader';
import { PageContainer } from '@/components/ui/page-container';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/search');

  const { id } = await params;

  return (
    <PageContainer className="max-w-[760px]">
      <JobDetailLoader id={id} />
    </PageContainer>
  );
}
