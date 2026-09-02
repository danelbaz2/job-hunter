import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { searches, searchResults } from '@/lib/db/schema';
import { fetchListings } from '@/lib/sources/adapter';
import { scoreListing } from '@/lib/scoring';
import { parseResumeFile } from '@/lib/resume/parse';
import { parseDateOrNull } from '@/lib/formatDate';
import { isDemoAllowed, DEMO_INTENT_TEXT } from '@/lib/demo/faults';
import type { Seniority, Source } from '@/types/domain';

/**
 * Streams newline-delimited progress events instead of one final JSON blob, so the search
 * UI can check off each source as its Apify actor call actually finishes, and show a
 * "Scoring fit…" step before the final result — rather than a single fixed-duration spinner.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const userId = session.user.id;

  const form = await req.formData();
  const locations = JSON.parse(String(form.get('locations') ?? '[]')) as string[];
  const seniorities = JSON.parse(String(form.get('seniorities') ?? '[]')) as Seniority[];
  const domains = JSON.parse(String(form.get('domains') ?? '[]')) as string[];
  const resumeMode = String(form.get('resumeMode') ?? 'paste') as 'upload' | 'paste';
  const demo = String(form.get('demo') ?? '') === '1' && isDemoAllowed();
  const intentText = demo
    ? String(form.get('intentText') ?? '').trim() || DEMO_INTENT_TEXT
    : String(form.get('intentText') ?? '').trim();

  // Résumé is optional now — a search can run on location/level/domain alone, or with just
  // the free-text intent. Only a file that was attached but can't be read is an error.
  let resumeText = '';
  if (resumeMode === 'upload') {
    const file = form.get('resumeFile') as File | null;
    if (file) {
      const parsed = await parseResumeFile(file);
      if (parsed.unreadable) {
        return NextResponse.json(
          { error: 'Could not read text from that file — it may be a scanned image. Paste a description instead.' },
          { status: 400 }
        );
      }
      resumeText = parsed.text;
    }
  } else {
    resumeText = String(form.get('resumeText') ?? '').trim();
  }

  if (locations.length === 0 || seniorities.length === 0) {
    return NextResponse.json({ error: 'Pick at least one location and seniority level' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));

      try {
        const { listings, sourceStatus } = await fetchListings(
          { locations, domains },
          (source: Source, status) => send({ type: 'source', source, status }),
          {
            demo,
            onSourceRetry: (source, retryNumber) =>
              send({ type: 'source', source, status: 'retrying', attempt: retryNumber }),
          }
        );

        send({ type: 'scoring' });

        const [search] = await db
          .insert(searches)
          .values({
            userId,
            locations,
            seniorities,
            domains,
            resumeText,
            resumeMode,
            intentText,
            sourceStatus,
          })
          .returning();

        // Sent as soon as the search row exists, well before scoring (the slow,
        // AI-bound step) finishes — lets the client navigate to the results page
        // and poll there for completedAt, instead of blocking on the full pipeline.
        send({ type: 'search-created', searchId: search.id });

        const scored = await Promise.all(
          listings.map((listing) =>
            scoreListing(listing, { locations, domains, seniorities, resumeText, intentText, demo })
          )
        );

        if (scored.length > 0) {
          await db.insert(searchResults).values(
            scored.map((s) => ({
              searchId: search.id,
              source: s.listing.source,
              externalId: s.listing.externalId,
              url: s.listing.url,
              title: s.listing.title,
              company: s.listing.company,
              companyLogoUrl: s.listing.companyLogoUrl,
              location: s.listing.location,
              postedAt: parseDateOrNull(s.listing.postedAt),
              description: s.listing.description,
              requirements: s.listing.requirements,
              rawText: s.listing.rawText,
              locationScore: s.locationScore,
              domainScore: s.domainScore,
              seniorityScore: s.seniorityScore,
              skillsScore: s.skillsScore,
              aiFailed: s.aiFailed,
              overallScore: s.overallScore,
              matchedPoints: s.matchedPoints,
              gapPoints: s.gapPoints,
            }))
          );
        }

        await db.update(searches).set({ completedAt: new Date() }).where(eq(searches.id, search.id));

        send({ type: 'done', searchId: search.id });
      } catch (err) {
        console.error('[api/search] search pipeline failed', err);
        send({ type: 'error', message: 'Search failed — please try again.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson' } });
}
