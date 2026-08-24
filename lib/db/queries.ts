import { db } from './client';
import { searches, searchResults, savedJobs } from './schema';
import { eq, inArray, desc } from 'drizzle-orm';
import type { SearchResultItem, SearchSummary, Source } from '@/types/domain';

/** Nav bar only shows "Results" once a search has actually been run — see it link there. */
export async function getLatestSearchId(userId: string): Promise<string | null> {
  const [latest] = await db
    .select({ id: searches.id })
    .from(searches)
    .where(eq(searches.userId, userId))
    .orderBy(desc(searches.createdAt))
    .limit(1);
  return latest?.id ?? null;
}

function toItem(row: typeof searchResults.$inferSelect, saved: boolean): SearchResultItem {
  return {
    id: row.id,
    source: row.source as Source,
    externalId: row.externalId,
    url: row.url,
    title: row.title,
    company: row.company,
    companyLogoUrl: row.companyLogoUrl,
    location: row.location,
    postedAt: row.postedAt ? row.postedAt.toISOString() : null,
    description: row.description,
    requirements: row.requirements,
    rawText: row.rawText,
    locationScore: row.locationScore,
    domainScore: row.domainScore,
    seniorityScore: row.seniorityScore,
    skillsScore: row.skillsScore,
    aiFailed: row.aiFailed,
    overallScore: row.overallScore,
    matchedPoints: row.matchedPoints,
    gapPoints: row.gapPoints,
    saved,
  };
}

export async function getSearchWithResults(
  searchId: string,
  userId: string
): Promise<{ summary: SearchSummary; jobs: SearchResultItem[] } | null> {
  const [search] = await db.select().from(searches).where(eq(searches.id, searchId));
  if (!search || search.userId !== userId) return null;

  const results = await db.select().from(searchResults).where(eq(searchResults.searchId, searchId));
  const saved = await db.select().from(savedJobs).where(eq(savedJobs.userId, userId));
  const savedIds = new Set(saved.map((s) => s.searchResultId));

  return {
    summary: {
      id: search.id,
      locations: search.locations,
      seniorities: search.seniorities as SearchSummary['seniorities'],
      domains: search.domains,
      sourceStatus: search.sourceStatus as SearchSummary['sourceStatus'],
    },
    jobs: results
      .map((r) => toItem(r, savedIds.has(r.id)))
      .sort((a, b) => b.overallScore - a.overallScore),
  };
}

export async function getSavedJobItems(userId: string): Promise<SearchResultItem[]> {
  const saved = await db.select().from(savedJobs).where(eq(savedJobs.userId, userId));
  if (saved.length === 0) return [];
  const ids = saved.map((s) => s.searchResultId);
  const results = await db.select().from(searchResults).where(inArray(searchResults.id, ids));
  return results.map((r) => toItem(r, true)).sort((a, b) => b.overallScore - a.overallScore);
}

export async function getJobItem(id: string, userId: string): Promise<SearchResultItem | null> {
  const [row] = await db.select().from(searchResults).where(eq(searchResults.id, id));
  if (!row) return null;
  const [saved] = await db
    .select()
    .from(savedJobs)
    .where(eq(savedJobs.searchResultId, id));
  return toItem(row, !!saved && saved.userId === userId);
}
