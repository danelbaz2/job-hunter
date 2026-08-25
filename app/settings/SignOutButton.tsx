'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  return (
    <Button type="button" variant="secondary" className="rounded-pill" onClick={() => signOut({ callbackUrl: '/' })}>
      Sign out
    </Button>
  );
}
