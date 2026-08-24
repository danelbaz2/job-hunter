import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SignOutButton } from './SignOutButton';
import styles from './Settings.module.css';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/');

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <h1>Settings</h1>

      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>Name</span>
          <span>{session.user.name ?? '—'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Email</span>
          <span>{session.user.email}</span>
        </div>
      </div>

      <SignOutButton />
    </div>
  );
}
