'use server';

import { auth } from '@/lib/auth';
import { getSearchWithResults } from '@/lib/db/queries';
import type { SearchResultItem, SearchSummary } from '@/types/domain';

export async function fetchSearchResults(
  searchId: string
): Promise<{ jobs: SearchResultItem[]; summary: SearchSummary } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return getSearchWithResults(searchId, session.user.id);
}
