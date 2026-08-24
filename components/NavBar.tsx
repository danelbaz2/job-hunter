'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './NavBar.module.css';
import { UserIcon } from './icons';

export function NavBar({ savedCount, signedIn }: { savedCount: number; signedIn: boolean }) {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    pathname === href || (href !== '/search' && pathname.startsWith(href))
      ? `${styles.link} ${styles.linkActive}`
      : styles.link;

  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>Job Hunter</span>
      <div className={styles.links}>
        <Link href="/search" className={linkClass('/search')}>
          Search
        </Link>
        <Link href="/results" className={linkClass('/results')}>
          Results
        </Link>
        <Link href="/saved" className={linkClass('/saved')}>
          Saved ({savedCount})
        </Link>
        <Link
          href={signedIn ? '/api/auth/signout' : '/api/auth/signin'}
          className={styles.iconButton}
          aria-label={signedIn ? 'Sign out' : 'Sign in'}
        >
          <UserIcon />
        </Link>
      </div>
    </nav>
  );
}
