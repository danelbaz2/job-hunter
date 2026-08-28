import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AuthCard } from './AuthCard';
import { Reveal } from '@/components/motion/Reveal';
import { Check } from 'lucide-react';

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
    <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-4 py-10 sm:px-6 lg:min-h-[calc(100dvh-68px)] lg:flex-row lg:items-center lg:gap-16 lg:px-8 lg:py-0">
      <div className="flex flex-1 flex-col gap-8 lg:gap-10">
        <span className="font-[family-name:var(--font-heading)] text-lg font-medium">
          Job<span className="text-accent-500">Hunter</span>
        </span>

        <div className="flex flex-col gap-6">
          <h1 className="text-4xl tracking-tight sm:text-5xl lg:text-6xl">
            Stop scrolling job boards. Start applying with fit.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-text/70">
            Job Hunter scans AllJobs, Drushim and Indeed-Israel, scores every listing against your
            resume, and tells you exactly why you match — or don&apos;t.
          </p>
          <div className="flex flex-col gap-3.5">
            {FEATURES.map((text) => (
              <Reveal key={text} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-800 text-accent-300">
                  <Check size={15} />
                </span>
                <span className="text-base leading-snug text-text/85">{text}</span>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="text-xs text-text/60">© 2026 Job Hunter. All rights reserved.</div>
      </div>

      <div className="flex flex-1 justify-center lg:justify-end">
        <AuthCard callbackUrl={callbackUrl ?? '/search'} />
      </div>
    </div>
  );
}
