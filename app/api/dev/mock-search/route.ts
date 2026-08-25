import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLatestSearchId } from '@/lib/db/queries';

/**
 * Dev-only "test mode" for the search UI: returns the current user's most recent
 * existing search so the searching/results flow can be exercised without spending
 * on Apify/OpenRouter. Hard-gated off outside development — never touches the real
 * search pipeline in app/api/search, only reads a search that's already in the DB.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const searchId = await getLatestSearchId(session.user.id);
  if (!searchId) {
    return NextResponse.json(
      { error: 'No existing search in the database yet — run one real search once to seed test data.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ searchId });
}
