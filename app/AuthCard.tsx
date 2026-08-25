'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Separator } from '@/components/ui/separator';

type Mode = 'signin' | 'signup';

const COPY: Record<Mode, { heading: string; sub: string; cta: string; switchPrompt: string; switchCta: string }> = {
  signin: {
    heading: 'Welcome back',
    sub: 'Sign in to see your matches.',
    cta: 'Sign in',
    switchPrompt: "Don't have an account?",
    switchCta: 'Create one',
  },
  signup: {
    heading: 'Create your account',
    sub: 'Takes about a minute — no resume needed yet.',
    cta: 'Create account',
    switchPrompt: 'Already have an account?',
    switchCta: 'Sign in',
  },
};

const EASE = [0.16, 1, 0.3, 1] as const;

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: -direction * 28 }),
};

function GoogleLogo() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.28-1.7 3.75-5.5 3.75-3.31 0-6.01-2.74-6.01-6.12S8.69 5.6 12 5.6c1.89 0 3.16.8 3.88 1.49l2.65-2.55C16.9 2.9 14.68 2 12 2 6.98 2 2.9 6.03 2.9 11.05S6.98 20.1 12 20.1c6.93 0 8.86-4.85 8.86-7.35 0-.5-.06-.88-.13-1.25H12z"
      />
    </svg>
  );
}

export function AuthCard({ callbackUrl }: { callbackUrl: string }) {
  const [mode, setMode] = useState<Mode>('signin');
  const [direction, setDirection] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const copy = COPY[mode];

  function switchMode(next: Mode) {
    if (next === mode) return;
    setDirection(next === 'signup' ? 1 : -1);
    setMode(next);
  }

  async function handleGoogle() {
    setGooglePending(true);
    await signIn('google', { callbackUrl });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Could not create account');
          setPending(false);
          return;
        }
      }

      const result = await signIn('credentials', { email, password, redirect: false, callbackUrl });
      if (result?.error) {
        setError('Incorrect email or password');
        setPending(false);
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setError('Something went wrong — please try again.');
      setPending(false);
    }
  }

  return (
    <motion.div layout className="w-full max-w-[400px] overflow-hidden rounded-lg bg-surface p-6 shadow-md sm:p-8">
      <SegmentedControl
        className="mb-6 w-full [&>button]:flex-1"
        options={[
          { value: 'signin', label: 'Sign in' },
          { value: 'signup', label: 'Create account' },
        ]}
        value={mode}
        onChange={switchMode}
      />

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={handleGoogle}
        disabled={pending || googlePending}
      >
        {googlePending ? <Loader2 size={18} className="animate-spin" /> : <GoogleLogo />}
        {googlePending ? 'Redirecting to Google…' : 'Continue with Google'}
      </Button>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-text/50">or</span>
        <Separator className="flex-1" />
      </div>

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={mode}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.32, ease: EASE }}
        >
          <h2 className="text-xl">{copy.heading}</h2>
          <p className="mb-5 mt-1 text-sm text-text/70">{copy.sub}</p>

          {error && (
            <div className="mb-4 rounded-md border border-tier-low-border bg-tier-low-bg px-3 py-2 text-sm text-tier-low-text">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {mode === 'signup' && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Dana Levi"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="dana@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {mode === 'signup' && <p className="mt-1.5 text-xs text-text/50">Use 8+ characters with a number and a symbol.</p>}
            </div>

            <Button type="submit" variant="solid" className="mt-1 w-full" disabled={pending}>
              {pending ? <Loader2 size={16} className="animate-spin" /> : copy.cta}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-text/70">
            {copy.switchPrompt}{' '}
            <button
              type="button"
              className="text-accent-400 hover:underline"
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {copy.switchCta}
            </button>
          </p>
        </motion.div>
      </AnimatePresence>

      <p className="mt-4 text-center text-xs text-text/40">
        By continuing you agree to Job Hunter&apos;s Terms of Service and Privacy Policy.
      </p>
    </motion.div>
  );
}
