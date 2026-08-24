# Job Hunter — Specification (v1)

## Part 1 — Goal and reason

**Goal:** Build a hosted web app that, given a user's job-search criteria (location, domain, seniority/scope, and their resume), queries multiple job platforms, returns matching listings ranked by fit, and for each listing shows which of the user's qualifications match and which are missing — plus suggested resume edits to improve fit.

**Reason:** Job seekers currently have to manually repeat the same search across many platforms and manually judge how well they fit each listing. This app collapses that into one pass, and turns "do I fit this job?" from a guess into a scored, explained answer with a concrete next action (what to fix on the resume).

Use this reason to break ties: when a design choice is ambiguous, prefer whatever gets the user to a trustworthy fit judgment fastest, over whatever maximizes listing volume or platform coverage.

## Part 2 — Testable success criteria

**Arithmetic / deterministic criteria** (one true/false answer each):
1. Given a user's location and a job's location, the location sub-score is 100% on exact/remote match, 0% on a different country, and a defined partial value for same-country-different-city.
2. Given a user's stated domain and a job's domain tag, the domain sub-score is binary (matches one of the user's stated domains, or not).
3. The overall match score for a listing equals a defined weighted combination of its sub-scores (location, domain, seniority, skills-fit) — recomputing it from the stored sub-scores must reproduce the same number.
4. Listings returned to the user are sorted strictly descending by overall match score.
5. Every returned listing shows at least one matched point and, unless the score is 100%, at least one gap point — never an empty explanation.

**Reference-measured criteria:**
6. Run the app with a real resume and real search criteria (per Part 4). Manually review the top 5 returned listings: the location and domain shown for each must be correct on inspection of the original listing (not hallucinated).
7. For at least 3 of those 5 listings, the "matched points" and "gap points" shown must hold up under the user's own judgment reading the listing side-by-side.
8. At least one AI-suggested resume edit, applied by the user, must plausibly raise their fit against a listing's stated requirements (judged by the user, not automated).

## Part 3 — Architectural guidance

- Stack: Next.js app, Postgres (Neon/Supabase free tier) for storage, Auth.js for authentication, deployed on Vercel.
- Auth supports two paths: Google OAuth, and email/password (Auth.js Credentials provider). Passwords are salted and hashed (scrypt) before storage — the app never stores or logs a plaintext password. Password-reset-by-email is out of scope for v1 (no email-sending provider is set up) — an account created with a forgotten password has no self-service recovery yet.
- Reach job data entirely through Apify actors: dedicated actors for AllJobs.co.il and Drushim (the two dominant Israeli job boards, neither of which exposes an official API), plus LinkedIn and Indeed.co.il actors filtered to Israel for broader coverage. Access every source only through a single job-source adapter layer — do not let scoring or UI code call Apify directly.
- Resume input: accept PDF/DOCX upload, parse to plain text on the server, and run the same analysis pipeline as pasted text. Output stays text-only (gap analysis, suggested rewritten bullets) — no regenerated document file.
- AI calls (skills-fit scoring, gap analysis, resume suggestions) go through OpenRouter, using a free-tier model (e.g. `meta-llama/llama-3.3-70b-instruct:free`), swappable via config without code changes.
- Deterministic scoring (location, domain, seniority) is computed in code, not by the AI — only skills/resume-language fit is delegated to the AI call.
- Leave internal file/module structure to the agent.

## Part 4 — Validation approach

Before considering v1 done: the user enters their own real resume and real search criteria (location, domain, scope), runs a search against the live job sources, and manually checks the top 5 results against criteria 6–8 above. Getting 3 out of 5 listings right (correct match data, defensible matched/gap points, at least one useful resume suggestion) is sufficient proof of the concept — this is not a bar for exhaustive coverage.

## Part 5 — Known pitfalls

- Every job source is an Apify scraper (AllJobs, Drushim, LinkedIn, Indeed) — none is an official API. All of them sit in a ToS gray area and can break silently when the target site changes its layout, or vary in freshness/cost depending on the actor maintainer. Treat scraper output as unreliable until validated, don't depend on any single actor staying available, and expect ongoing selection/maintenance of which actor per source to use.
- Apify usage is pay-per-result rather than fully free — searches should request a bounded number of results (per Part 4's "3-5 is enough to prove the point"), not attempt broad/repeated pulls, to stay within free credit.
- Free OpenRouter models have rate limits and can be slow or occasionally unavailable — the app should degrade (queue/retry or show partial results) rather than fail the whole search.
- PDF text extraction can produce garbled or empty text for scanned/image-based resumes — detect this case and tell the user, rather than silently scoring against blank text.
- The AI may hallucinate a match or gap point not actually present in the listing text — Part 2 criterion 6/7 exists specifically to catch this; don't trust AI output without the listing text alongside it.
- The same job can appear from multiple sources with slightly different text (duplicate listings) — dedupe by a reasonable key (title + company + location) before scoring, or the user sees the same job twice with different scores.
- A listing can go stale (position filled/removed) between fetch and display — don't cache listings indefinitely without a freshness check.
- AI-suggested resume edits can overstate the user's experience — the suggestion must stay truthful to what's in the original resume, never invent qualifications.
- A Google-linked account and a password-created account can collide on the same email — decide and document which one wins (or link them) rather than leaving two silent accounts for one person.
