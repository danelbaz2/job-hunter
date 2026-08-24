import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe subset of the auth config — no providers (Credentials pulls in Node's
 * `crypto` via lib/auth/password.ts, which the Edge runtime can't load) and no DB adapter.
 * middleware.ts uses only this to verify the session JWT. lib/auth.ts extends it with the
 * real providers for use in API routes / server components (Node runtime).
 */
export const authConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
};
