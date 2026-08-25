'use server';

import { auth } from '@/lib/auth';
import { getSavedJobItems } from '@/lib/db/queries';
import type { SearchResultItem } from '@/types/domain';

export async function fetchSavedJobs(): Promise<SearchResultItem[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  return getSavedJobItems(session.user.id);
}
