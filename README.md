# Job Hunter

Searching for a job in Israel means running the same search on AllJobs, Drushim, LinkedIn and Indeed, then reading every listing to guess whether you fit. Job Hunter does both in one pass: it pulls listings from all four boards, removes duplicates, ranks them by fit against your resume or a short description of what you want, and shows for each listing what matches, what is missing, and how to adjust your resume.

**How it works**

- **One adapter layer for all sources.** Each board is reached through an Apify actor behind a single interface, so scoring and UI code never talk to a scraper directly.
- **Deterministic where possible, AI only where needed.** Location, domain and seniority are scored in code. Only skills fit is delegated to an LLM (through OpenRouter, model swappable by config).
- **No unverified AI claims.** Every match or gap point the model returns must quote the listing word for word. If the quote is not an exact substring of the listing text, the point is dropped.
- **Built to degrade, not fail.** Scraper and LLM calls retry on transient errors with a low cap, and a failing source shows as partial results instead of breaking the search.

**Stack:** Next.js 15, TypeScript, PostgreSQL (Drizzle ORM), Auth.js (Google OAuth + email/password with scrypt), Apify, OpenRouter, Tailwind.

The full requirements and design decisions are in [`SPEC.md`](SPEC.md). The UI follows `design_handoff_job_hunter_ui/`.

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
- Transient failures are retried: Apify actor calls up to 2× per source (`lib/sources/apifyRunner.ts`, capped low because each retry can be another paid run — a failed dataset read retries for free without re-running the actor), and OpenRouter calls up to 2× on network/timeout/429/5xx only (`lib/openrouter.ts`). A source being re-attempted shows as a spinning "retrying n/2" badge on the searching screen.
- **Failure-scenario demo:** the search page always has a "Run failure scenario" button, in every environment (it's a graded deliverable — must be reachable on the deployed app). It runs the real pipeline with a scripted fault set (`lib/demo/faults.ts`): AllJobs recovers after 2 retries, Indeed exhausts its retries and degrades to `failed` while the others carry on, LinkedIn's dataset read fails once then reuses the run, and every OpenRouter call 503s once then succeeds. No external calls are made — a demo run costs nothing; it only writes a normal search row. The four sources run concurrently but on staggered simulated timings (~22s total, tune with `DEMO_SPEED` in `lib/demo/faults.ts`) and a terminal-style activity log narrates each step.
