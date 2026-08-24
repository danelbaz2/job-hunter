import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

// "/" is the public landing/auth page (Google + email/password) — everything else requires
// a session, and unauthenticated requests bounce back to "/" with a callback to return to.
export default auth((req) => {
  if (req.nextUrl.pathname === '/') return NextResponse.next();
  if (!req.auth) {
    const signInUrl = new URL('/', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ['/((?!api/auth|api/signup|_next/static|_next/image|favicon.ico).*)'],
};
