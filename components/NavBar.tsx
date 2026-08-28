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

/** Desktop row: an animated pill (same treatment as SegmentedControl's active
 * indicator) slides between items via layoutId. Defined at module scope, not nested
 * inside NavBar's render body — a component defined inside a parent's render function
 * gets recreated as a new type on every render, which unmounts/remounts it instead of
 * re-rendering, breaking layoutId's cross-render tracking (the pill can't animate
 * between positions if the node behind it isn't the same node from render to render). */
function DesktopNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'relative rounded-pill px-3 py-1.5 text-sm transition-colors',
        active ? 'text-accent-400' : 'text-text/85 hover:bg-text/7 hover:text-text'
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 -z-10 rounded-pill shadow-[inset_0_0_0_1px_var(--color-accent-500)]"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      {children}
    </Link>
  );
}

/** The mobile drawer's own static version — no shared layoutId with the desktop row,
 * since both can be mounted simultaneously (one just CSS-hidden) and two elements
 * fighting over one layoutId would visibly glitch. */
function MobileNavLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'rounded-pill px-3 py-2 text-sm transition-colors',
        active
          ? 'text-accent-400 shadow-[inset_0_0_0_1px_var(--color-accent-500)]'
          : 'text-text/85 hover:bg-text/7 hover:text-text'
      )}
    >
      {children}
    </Link>
  );
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

  const initial = (user.name ?? user.email ?? '?').charAt(0).toUpperCase();

  return (
    <nav className="relative flex items-center gap-4 px-4 py-3 sm:px-6">
      <span className="mr-auto font-[family-name:var(--font-heading)] text-lg font-medium">
        Job<span className="text-accent-500">Hunter</span>
      </span>

      <div className="hidden items-center gap-1 md:flex">
        <DesktopNavLink href="/search" active={isActive('/search')}>
          Search
        </DesktopNavLink>
        {latestSearchId && (
          <DesktopNavLink href={`/results?searchId=${latestSearchId}`} active={isActive('/results')}>
            Results
          </DesktopNavLink>
        )}
        <DesktopNavLink href="/saved" active={isActive('/saved')}>
          Saved ({savedCount})
        </DesktopNavLink>
      </div>

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
            <div className="flex flex-col items-start gap-1">
              <MobileNavLink href="/search" active={isActive('/search')} onClick={() => setDrawerOpen(false)}>
                Search
              </MobileNavLink>
              {latestSearchId && (
                <MobileNavLink
                  href={`/results?searchId=${latestSearchId}`}
                  active={isActive('/results')}
                  onClick={() => setDrawerOpen(false)}
                >
                  Results
                </MobileNavLink>
              )}
              <MobileNavLink href="/saved" active={isActive('/saved')} onClick={() => setDrawerOpen(false)}>
                Saved ({savedCount})
              </MobileNavLink>
            </div>
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
