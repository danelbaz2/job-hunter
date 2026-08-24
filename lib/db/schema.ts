import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// --- Auth.js (Google-only per CLAUDE.md) ---

export const users = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  // Null for a Google-only account. Scrypt salt:hash — never a plaintext password.
  passwordHash: text('passwordHash'),
});

export const accounts = pgTable(
  'account',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// --- Domain: searches & results (SPEC.md Part 2/3) ---

export const searches = pgTable('search', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  locations: jsonb('locations').$type<string[]>().notNull(),
  seniorities: jsonb('seniorities').$type<string[]>().notNull(),
  domains: jsonb('domains').$type<string[]>().notNull(),
  resumeText: text('resumeText').notNull(),
  resumeMode: text('resumeMode').$type<'upload' | 'paste'>().notNull(),
  // per-source status: 'ok' | 'failed' — drives the degraded-source banner (README)
  sourceStatus: jsonb('sourceStatus').$type<Record<string, 'ok' | 'failed'>>().notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});

export const searchResults = pgTable('search_result', {
  id: uuid('id').defaultRandom().primaryKey(),
  searchId: uuid('searchId')
    .notNull()
    .references(() => searches.id, { onDelete: 'cascade' }),
  source: text('source').notNull(),
  externalId: text('externalId').notNull(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  companyLogoUrl: text('companyLogoUrl'),
  location: text('location').notNull(),
  postedAt: timestamp('postedAt', { mode: 'date' }),
  description: text('description').notNull(),
  requirements: jsonb('requirements').$type<string[]>().notNull(),
  rawText: text('rawText').notNull(),

  locationScore: integer('locationScore').notNull(),
  domainScore: integer('domainScore').notNull(),
  seniorityScore: integer('seniorityScore').notNull(),
  skillsScore: integer('skillsScore'), // null when AI scoring failed (SPEC.md non-negotiable: never fabricate)
  aiFailed: boolean('aiFailed').notNull().default(false),
  overallScore: integer('overallScore').notNull(),

  matchedPoints: jsonb('matchedPoints').$type<{ text: string; quote: string }[]>().notNull(),
  gapPoints: jsonb('gapPoints').$type<{ text: string; quote: string }[]>().notNull(),

  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});

export const savedJobs = pgTable(
  'saved_job',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    searchResultId: uuid('searchResultId')
      .notNull()
      .references(() => searchResults.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.searchResultId] })]
);
