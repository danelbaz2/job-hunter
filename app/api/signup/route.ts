import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { hashPassword, isPasswordStrongEnough } from '@/lib/auth/password';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const { name, email: rawEmail, password } = await req.json();
  const email = String(rawEmail ?? '').trim().toLowerCase();
  const trimmedName = String(name ?? '').trim();

  if (!trimmedName) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }
  if (!isPasswordStrongEnough(String(password ?? ''))) {
    return NextResponse.json(
      { error: 'Password must be 8+ characters with a number and a symbol' },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    // SPEC.md: one email belongs to whichever method created it first.
    return NextResponse.json(
      {
        error: existing.passwordHash
          ? 'An account with this email already exists — sign in instead.'
          : 'This email is already linked to a Google account — continue with Google instead.',
      },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({ name: trimmedName, email, passwordHash });

  return NextResponse.json({ ok: true });
}
