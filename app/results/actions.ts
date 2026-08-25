'use server';

import { auth } from '@/lib/auth';
import { getSearchWithResults } from '@/lib/db/queries';
import type { SearchResultItem, SearchSummary } from '@/types/domain';

export type SearchResultsFetchResult =
  | { status: 'ready'; jobs: SearchResultItem[]; summary: SearchSummary }
  | { status: 'pending' }
  | { status: 'not-found' };

export async function fetchSearchResults(searchId: string): Promise<SearchResultsFetchResult> {
  const session = await auth();
  if (!session?.user?.id) return { status: 'not-found' };

  const result = await getSearchWithResults(searchId, session.user.id);
  if (!result) return { status: 'not-found' };

  // The search row (and its summary) exists as soon as sourcing finishes — well
  // before scoring does. completedAt is only set once scoring has actually run and
  // searchResults rows exist, so it's the real "is this ready to show" signal, not
  // just "does the row exist".
  if (!result.summary.completedAt) return { status: 'pending' };

  return { status: 'ready', jobs: result.jobs, summary: result.summary };
}
