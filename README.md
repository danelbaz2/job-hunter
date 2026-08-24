# Job Hunter

Next.js app implementing `design_handoff_job_hunter_ui/` per `SPEC.md` and `CLAUDE.md` at the repo root.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` — Postgres connection string (Neon/Supabase free tier)
   - `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Auth.js Google OAuth
   - `APIFY_TOKEN` + one actor ID per source — see SPEC.md Part 5 on picking/maintaining actors
   - `OPENROUTER_API_KEY` — skills-fit AI scoring
3. `npm run db:generate && npm run db:migrate`
4. `npm run dev`

## Notes

- Apify actor field mappings in `lib/sources/*.ts` are written against common scraper output shapes and will likely need adjusting to whichever specific actor you pick per source (SPEC.md Part 5: actor choice is ongoing maintenance, not fixed).
- Skills-fit AI output is only trusted after its quote is verified as a verbatim substring of the listing text (`lib/scoring/ai.ts`) — this is a CLAUDE.md non-negotiable, not optional validation.
