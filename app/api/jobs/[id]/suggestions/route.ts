import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { searches, searchResults } from '@/lib/db/schema';
import { buildCandidateText } from '@/lib/scoring';
import { generateResumeSuggestions } from '@/lib/scoring/suggestions';

/**
 * On-demand résumé suggestions for one listing (SPEC.md criterion 8). Generated when the
 * user asks from the job-detail page — one AI call per listing viewed — then cached on the
 * row so a repeat visit is free.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { id } = await params;

  const [row] = await db.select().from(searchResults).where(eq(searchResults.id, id));
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [search] = await db.select().from(searches).where(eq(searches.id, row.searchId));
  if (!search || search.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (row.resumeSuggestions) {
    return NextResponse.json({ items: row.resumeSuggestions });
  }

  const candidateText = buildCandidateText(search.resumeText, search.intentText);
  if (!candidateText.trim()) {
    return NextResponse.json(
      { error: 'Add a résumé or a description to your search to get tailored suggestions.' },
      { status: 422 }
    );
  }

  const result = await generateResumeSuggestions(candidateText, {
    source: row.source as never,
    externalId: row.externalId,
    url: row.url,
    title: row.title,
    company: row.company,
    companyLogoUrl: row.companyLogoUrl,
    location: row.location,
    postedAt: null,
    description: row.description,
    requirements: row.requirements,
    rawText: row.rawText,
  });

  if (!result.ok) {
    const msg =
      result.error === 'no-candidate-text'
        ? 'Add a résumé or a description to your search to get tailored suggestions.'
        : 'Suggestions are unavailable right now — the AI call failed. Try again in a moment.';
    return NextResponse.json({ error: msg }, { status: result.error === 'no-candidate-text' ? 422 : 502 });
  }

  await db.update(searchResults).set({ resumeSuggestions: result.items }).where(eq(searchResults.id, id));

  return NextResponse.json({ items: result.items });
}
