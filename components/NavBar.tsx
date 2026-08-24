'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import styles from './NavBar.module.css';

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
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const linkClass = (href: string) =>
    pathname === href || (href !== '/search' && pathname.startsWith(href))
      ? `${styles.link} ${styles.linkActive}`
      : styles.link;

  const initial = (user.name ?? user.email ?? '?').charAt(0).toUpperCase();

  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>Job Hunter</span>
      <div className={styles.links}>
        <Link href="/search" className={linkClass('/search')}>
          Search
        </Link>
        {latestSearchId && (
          <Link href={`/results?searchId=${latestSearchId}`} className={linkClass('/results')}>
            Results
          </Link>
        )}
        <Link href="/saved" className={linkClass('/saved')}>
          Saved ({savedCount})
        </Link>

        <div className={styles.accountWrap} ref={wrapRef}>
          <button
            type="button"
            className={styles.avatarButton}
            onClick={() => setOpen((v) => !v)}
            aria-label="Account menu"
            aria-expanded={open}
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className={styles.avatarImg} />
            ) : (
              initial
            )}
          </button>

          {open && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                {user.name && <div className={styles.dropdownName}>{user.name}</div>}
                {user.email && <div className={styles.dropdownEmail}>{user.email}</div>}
              </div>
              <Link href="/settings" className={styles.dropdownItem} onClick={() => setOpen(false)}>
                Settings
              </Link>
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
