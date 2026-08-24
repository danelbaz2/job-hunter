import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getJobItem } from '@/lib/db/queries';
import { JobDetailClient } from './JobDetailClient';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/search');

  const { id } = await params;
  const job = await getJobItem(id, session.user.id);
  if (!job) notFound();

  return (
    <div className="page">
      <JobDetailClient job={job} />
    </div>
  );
}
