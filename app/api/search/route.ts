import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { searches, searchResults } from '@/lib/db/schema';
import { fetchListings } from '@/lib/sources/adapter';
import { scoreListing } from '@/lib/scoring';
import { parseResumeFile } from '@/lib/resume/parse';
import type { Seniority } from '@/types/domain';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const form = await req.formData();
  const location = String(form.get('location') ?? '');
  const seniority = String(form.get('seniority') ?? '') as Seniority;
  const domains = JSON.parse(String(form.get('domains') ?? '[]')) as string[];
  const resumeMode = String(form.get('resumeMode') ?? 'paste') as 'upload' | 'paste';

  let resumeText = '';
  if (resumeMode === 'upload') {
    const file = form.get('resumeFile') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No resume file provided' }, { status: 400 });
    }
    const parsed = await parseResumeFile(file);
    if (parsed.unreadable) {
      return NextResponse.json(
        { error: 'Could not read text from that file — it may be a scanned image. Try "Paste text" instead.' },
        { status: 400 }
      );
    }
    resumeText = parsed.text;
  } else {
    resumeText = String(form.get('resumeText') ?? '').trim();
    if (!resumeText) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }
  }

  if (!location || !seniority) {
    return NextResponse.json({ error: 'Location and seniority are required' }, { status: 400 });
  }

  const { listings, sourceStatus } = await fetchListings({ location, domains });

  const [search] = await db
    .insert(searches)
    .values({
      userId: session.user.id,
      location,
      seniority,
      domains,
      resumeText,
      resumeMode,
      sourceStatus,
    })
    .returning();

  const scored = await Promise.all(
    listings.map((listing) => scoreListing(listing, { location, domains, seniority, resumeText }))
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
        location: s.listing.location,
        postedAt: s.listing.postedAt ? new Date(s.listing.postedAt) : null,
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

  return NextResponse.json({ searchId: search.id });
}
