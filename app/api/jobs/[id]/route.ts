import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getJobItem } from '@/lib/db/queries';

/**
 * Client-fetch endpoint backing the job-detail cache (JobDetailLoader). Read-only,
 * same auth/ownership scoping as the server-rendered path via getJobItem — this just
 * lets the client drive its own loading/cache timing instead of the page doing the
 * fetch server-side.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { id } = await params;
  const job = await getJobItem(id, session.user.id);
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(job);
}
