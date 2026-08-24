import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AuthCard } from './AuthCard';
import { CheckIcon } from '@/components/icons';
import styles from './Landing.module.css';

const FEATURES = [
  'One search across every major Israeli job board',
  'A fit score with the exact matched and missing points',
  'Resume edit suggestions to close the gaps that matter',
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user) redirect(callbackUrl ?? '/search');

  return (
    <div className={styles.wrap}>
      <div className={styles.pitch}>
        <div className={styles.brand}>
          <span className={styles.brandLabel}>
            Job<span className={styles.brandAccent}>Hunter</span>
          </span>
        </div>

        <div className={styles.pitchBodyRow}>
          <div className={styles.pitchBody}>
            <h1 className={styles.headline}>Stop scrolling job boards. Start applying with fit.</h1>
            <p className={styles.subhead}>
              Job Hunter scans AllJobs, Drushim and Indeed-Israel, scores every listing against
              your resume, and tells you exactly why you match — or don&apos;t.
            </p>
            <div className={styles.features}>
              {FEATURES.map((text) => (
                <div key={text} className={styles.feature}>
                  <CheckIcon />
                  <span className={styles.featureText}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>© 2026 Job Hunter. All rights reserved.</div>
      </div>

      <div className={styles.authPane}>
        <AuthCard callbackUrl={callbackUrl ?? '/search'} />
      </div>
    </div>
  );
}
