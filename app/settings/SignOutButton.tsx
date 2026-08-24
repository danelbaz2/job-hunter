'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      style={{
        border: '1px solid var(--neutral-700)',
        background: 'transparent',
        color: 'var(--text)',
        borderRadius: 'var(--radius-pill)',
        padding: '10px 22px',
        fontSize: 14,
      }}
    >
      Sign out
    </button>
  );
}
