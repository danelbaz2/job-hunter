'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useNavVisibility } from '@/components/NavVisibility';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavUser {
  name: string | null;
  email: string | null;
  image: string | null;
}

export function NavBar({
  savedCount,
  latestSearchId,
  user,
}: {
  savedCount: number;
  latestSearchId: string | null;
  user: NavUser;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { hidden } = useNavVisibility();

  if (hidden) return null;

  const isActive = (href: string) => pathname === href || (href !== '/search' && pathname.startsWith(href));

  const linkClass = (href: string) =>
    cn('text-sm transition-colors hover:text-accent-500', isActive(href) && 'text-accent-500');

  const initial = (user.name ?? user.email ?? '?').charAt(0).toUpperCase();

  const links = (
    <>
      <Link href="/search" className={linkClass('/search')} onClick={() => setDrawerOpen(false)}>
        Search
      </Link>
      {latestSearchId && (
        <Link
          href={`/results?searchId=${latestSearchId}`}
          className={linkClass('/results')}
          onClick={() => setDrawerOpen(false)}
        >
          Results
        </Link>
      )}
      <Link href="/saved" className={linkClass('/saved')} onClick={() => setDrawerOpen(false)}>
        Saved ({savedCount})
      </Link>
    </>
  );

  return (
    <nav className="relative flex items-center gap-4 px-4 py-3 sm:px-6">
      <span className="mr-auto font-[family-name:var(--font-heading)] text-lg font-medium">
        Job<span className="text-accent-500">Hunter</span>
      </span>

      <div className="hidden items-center gap-5 md:flex">{links}</div>

      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-accent-800 text-sm text-accent-100"
              aria-label="Account menu"
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(user.name || user.email) && (
              <>
                <DropdownMenuLabel>
                  {user.name && <div className="text-text">{user.name}</div>}
                  {user.email && <div className="text-text/60">{user.email}</div>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-md md:hidden"
        aria-label="Menu"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen((v) => !v)}
      >
        {drawerOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 top-[52px] z-40 flex flex-col gap-4 border-t border-border bg-surface px-4 py-4 md:hidden"
          >
            {links}
            <div className="flex items-center gap-2 border-t border-border pt-4 text-sm">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-800 text-accent-100">
                  {initial}
                </span>
              )}
              <span className="text-text/85">{user.name ?? user.email}</span>
            </div>
            <Link href="/settings" className="text-sm text-text/85" onClick={() => setDrawerOpen(false)}>
              Settings
            </Link>
            <button type="button" className="text-left text-sm text-text/85" onClick={() => signOut({ callbackUrl: '/' })}>
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
