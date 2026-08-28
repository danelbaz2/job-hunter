import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { appliedJobs } from '@/lib/db/schema';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { id } = await params;

  await db
    .insert(appliedJobs)
    .values({ userId: session.user.id, searchResultId: id })
    .onConflictDoNothing();

  return NextResponse.json({ applied: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { id } = await params;

  await db
    .delete(appliedJobs)
    .where(and(eq(appliedJobs.userId, session.user.id), eq(appliedJobs.searchResultId, id)));

  return NextResponse.json({ applied: false });
}
