'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import styles from './Landing.module.css';
import { GoogleIcon } from '@/components/icons';

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

export function AuthCard({ callbackUrl }: { callbackUrl: string }) {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const copy = COPY[mode];

  async function handleGoogle() {
    setPending(true);
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
    <div className={styles.authBox}>
      <div className={styles.seg}>
        <button
          type="button"
          className={`${styles.segOpt} ${mode === 'signin' ? styles.segOptSelected : ''}`}
          onClick={() => setMode('signin')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`${styles.segOpt} ${mode === 'signup' ? styles.segOptSelected : ''}`}
          onClick={() => setMode('signup')}
        >
          Create account
        </button>
      </div>

      <h2 className={styles.h2}>{copy.heading}</h2>
      <p className={styles.sub}>{copy.sub}</p>

      <button type="button" className={styles.googleButton} onClick={handleGoogle} disabled={pending}>
        <GoogleIcon />
        Continue with Google
      </button>

      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>or</span>
        <div className={styles.dividerLine} />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <div className={styles.field}>
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              className={styles.input}
              type="text"
              placeholder="Dana Levi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className={styles.input}
            type="email"
            placeholder="dana@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.field} style={{ marginBottom: 8 }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className={styles.input}
            type="password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {mode === 'signup' && (
          <p className={styles.hint}>Use 8+ characters with a number and a symbol.</p>
        )}

        <button type="submit" className={styles.submit} disabled={pending} style={{ marginTop: mode === 'signin' ? 22 : 0 }}>
          {copy.cta}
        </button>
      </form>

      <p className={styles.switchPrompt}>
        {copy.switchPrompt}{' '}
        <button
          type="button"
          className={styles.switchLink}
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {copy.switchCta}
        </button>
      </p>

      <p className={styles.terms}>
        By continuing you agree to Job Hunter&apos;s Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
