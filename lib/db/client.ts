import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// In dev, Next.js hot-reloads this module on every file change, and each reload was creating
// a brand-new postgres connection pool without closing the old one — those piled up across a
// session of edits until Supabase's pooler (capped at 15 connections in session mode) started
// rejecting new ones with EMAXCONNSESSION. Caching the client on globalThis survives hot
// reloads so the same pool is reused instead of leaking a new one each time.
declare global {
  // eslint-disable-next-line no-var
  var __dbClient: ReturnType<typeof postgres> | undefined;
}

const client = global.__dbClient ?? postgres(process.env.DATABASE_URL!, { max: 5 });

if (process.env.NODE_ENV !== 'production') {
  global.__dbClient = client;
}

export const db = drizzle(client, { schema });
