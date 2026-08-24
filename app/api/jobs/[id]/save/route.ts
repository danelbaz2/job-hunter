import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { savedJobs } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { id } = await params;

  await db
    .insert(savedJobs)
    .values({ userId: session.user.id, searchResultId: id })
    .onConflictDoNothing();

  return NextResponse.json({ saved: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { id } = await params;

  await db
    .delete(savedJobs)
    .where(and(eq(savedJobs.userId, session.user.id), eq(savedJobs.searchResultId, id)));

  return NextResponse.json({ saved: false });
}
