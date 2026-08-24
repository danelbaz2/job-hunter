import type { Metadata } from 'next';
import { NavBar } from '@/components/NavBar';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { savedJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import './globals.css';

export const metadata: Metadata = {
  title: 'Job Hunter',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let savedCount = 0;
  if (session?.user?.id) {
    const rows = await db.select().from(savedJobs).where(eq(savedJobs.userId, session.user.id));
    savedCount = rows.length;
  }

  return (
    <html lang="en">
      <body>
        <NavBar savedCount={savedCount} signedIn={!!session} />
        {children}
      </body>
    </html>
  );
}
