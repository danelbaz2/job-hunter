import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import { MotionConfig } from 'motion/react';
import { NavBar } from '@/components/NavBar';
import { NavVisibilityProvider } from '@/components/NavVisibility';
import { NavSkeleton } from '@/components/skeletons/NavSkeleton';
import { Toaster } from '@/components/ui/sonner';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { savedJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getLatestSearchId } from '@/lib/db/queries';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Job Hunter',
};

async function NavBarSlot() {
  const session = await auth();
  if (!session?.user) return null;

  let savedCount = 0;
  let latestSearchId: string | null = null;
  if (session.user.id) {
    const rows = await db.select().from(savedJobs).where(eq(savedJobs.userId, session.user.id));
    savedCount = rows.length;
    latestSearchId = await getLatestSearchId(session.user.id);
  }

  return (
    <NavBar
      savedCount={savedCount}
      latestSearchId={latestSearchId}
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col">
        <MotionConfig reducedMotion="user">
          <NavVisibilityProvider>
            <div className="shrink-0">
              <Suspense fallback={<NavSkeleton />}>
                <NavBarSlot />
              </Suspense>
            </div>
            {/* flex-1 with no overflow constraint here: most pages are taller than the
                viewport and should scroll normally. A page that needs to fit exactly
                within the remaining space (e.g. /search) can use h-full on its own root
                to size against this, rather than 100dvh, which would ignore the nav. */}
            <div className="flex-1">{children}</div>
            <Toaster />
          </NavVisibilityProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
