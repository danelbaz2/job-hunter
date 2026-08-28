import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { JobDetailLoader } from './JobDetailLoader';
import { PageContainer } from '@/components/ui/page-container';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/search');

  const { id } = await params;

  // Narrow single column below lg (matches JobDetailClient's own stacked layout); wide
  // at lg with tighter side padding, and wider still past xl — on a big monitor the
  // three-column layout should actually use the extra width instead of leaving large
  // dead margins either side.
  return (
    <PageContainer className="max-w-[760px] lg:max-w-[1500px] lg:px-6 xl:max-w-[1760px] 2xl:max-w-[1960px]">
      <JobDetailLoader id={id} />
    </PageContainer>
  );
}
