import { db } from './client';
import { searches, searchResults, savedJobs, appliedJobs } from './schema';
import { eq, inArray, desc } from 'drizzle-orm';
import type { SearchResultItem, SearchSummary, Source } from '@/types/domain';

export interface UserStats {
  searchesRun: number;
  listingsScored: number;
  savedCount: number;
  appliedCount: number;
  /** Null when the user hasn't run a search that produced any scored listing yet. */
  avgScore: number | null;
  bestScore: number | null;
}

/** Settings-page activity summary. Bounded by this user's own data — fine at this
 * project's proof-of-concept scale (SPEC.md Part 4). */
export async function getUserStats(userId: string): Promise<UserStats> {
  const userSearches = await db.select({ id: searches.id }).from(searches).where(eq(searches.userId, userId));
  const searchIds = userSearches.map((s) => s.id);

  const results = searchIds.length
    ? await db
        .select({ overallScore: searchResults.overallScore })
        .from(searchResults)
        .where(inArray(searchResults.searchId, searchIds))
    : [];

  const saved = await db.select().from(savedJobs).where(eq(savedJobs.userId, userId));
  const applied = await db.select().from(appliedJobs).where(eq(appliedJobs.userId, userId));

  const scores = results.map((r) => r.overallScore);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const bestScore = scores.length ? Math.max(...scores) : null;

  return {
    searchesRun: userSearches.length,
    listingsScored: results.length,
    savedCount: saved.length,
    appliedCount: applied.length,
    avgScore,
    bestScore,
  };
}

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

function toItem(
  row: typeof searchResults.$inferSelect,
  saved: boolean,
  applied: boolean
): SearchResultItem {
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
    resumeSuggestions: row.resumeSuggestions ?? null,
    saved,
    applied,
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
  const applied = await db.select().from(appliedJobs).where(eq(appliedJobs.userId, userId));
  const appliedIds = new Set(applied.map((a) => a.searchResultId));

  return {
    summary: {
      id: search.id,
      locations: search.locations,
      seniorities: search.seniorities as SearchSummary['seniorities'],
      domains: search.domains,
      sourceStatus: search.sourceStatus as SearchSummary['sourceStatus'],
      completedAt: search.completedAt ? search.completedAt.toISOString() : null,
    },
    jobs: results
      .map((r) => toItem(r, savedIds.has(r.id), appliedIds.has(r.id)))
      .sort((a, b) => b.overallScore - a.overallScore),
  };
}

export async function getSavedJobItems(userId: string): Promise<SearchResultItem[]> {
  const saved = await db.select().from(savedJobs).where(eq(savedJobs.userId, userId));
  if (saved.length === 0) return [];
  const ids = saved.map((s) => s.searchResultId);
  const results = await db.select().from(searchResults).where(inArray(searchResults.id, ids));
  const applied = await db.select().from(appliedJobs).where(eq(appliedJobs.userId, userId));
  const appliedIds = new Set(applied.map((a) => a.searchResultId));
  return results
    .map((r) => toItem(r, true, appliedIds.has(r.id)))
    .sort((a, b) => b.overallScore - a.overallScore);
}

export async function getJobItem(id: string, userId: string): Promise<SearchResultItem | null> {
  const [row] = await db.select().from(searchResults).where(eq(searchResults.id, id));
  if (!row) return null;
  const [saved] = await db.select().from(savedJobs).where(eq(savedJobs.searchResultId, id));
  const [applied] = await db.select().from(appliedJobs).where(eq(appliedJobs.searchResultId, id));
  return toItem(
    row,
    !!saved && saved.userId === userId,
    !!applied && applied.userId === userId
  );
}
