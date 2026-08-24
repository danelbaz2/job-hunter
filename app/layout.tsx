import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { savedJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getLatestSearchId } from '@/lib/db/queries';
import './globals.css';

export const metadata: Metadata = {
  title: 'Job Hunter',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let savedCount = 0;
  let latestSearchId: string | null = null;
  if (session?.user?.id) {
    const rows = await db.select().from(savedJobs).where(eq(savedJobs.userId, session.user.id));
    savedCount = rows.length;
    latestSearchId = await getLatestSearchId(session.user.id);
  }

  return (
    <html lang="en">
      <body>
        {session?.user && (
          <NavBar
            savedCount={savedCount}
            latestSearchId={latestSearchId}
            user={{
              name: session.user.name ?? null,
              email: session.user.email ?? null,
              image: session.user.image ?? null,
            }}
          />
        )}
        {children}
      </body>
    </html>
  );
}
