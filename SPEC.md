# Job Hunter — Specification (v2)

v1 (Next.js, kept in git history) proved the core idea: search several Israeli job boards at once and score fit honestly, with every match point quoted verbatim from the listing. v2 rebuilds it on a Python/React stack and turns a one-shot search tool into a product people use every day, with a paid tier.

## Part 1 — Goal and reason

**Goal:** A hosted web app where a job seeker in any field, not only tech, keeps a personal space (profile, master resume, saved searches, applications), gets matching listings from multiple Israeli job boards every day, sees exactly where they fit and where they don't, gets an ATS-friendly resume tailored to a chosen listing, and can close a skill gap through a short learning path that ends with verifiable proof.

**Reason:** Job seekers repeat the same search on four boards, guess whether they fit, and rewrite their resume by hand for every application. Existing tools (Jobscan, Teal) tailor resumes but ignore the Israeli market and Hebrew listings, and nothing connects "you're missing X for this job" to "here's how to learn X and prove it".

**Tie-breaker:** when a design choice is ambiguous, prefer whatever keeps the user's resume and fit judgment truthful and verifiable, over whatever maximizes listing volume, AI output, or apparent fit.

## Part 2 — Testable success criteria

### Carried over from v1 (still hold)
1. Location sub-score is distance-based from the city chosen in the search: 100 for the same city or remote, then decreasing with straight-line distance (≤ 15 km 85, ≤ 35 km 60, ≤ 70 km 40, beyond 25), so a far listing ranks lower without disappearing. An unknown location, or no city chosen, is neutral (50). The bands live in one table in code.
2. Occupation sub-score: the search names one or more occupations, picked from the taxonomy (a whole family or a single role) or typed as free text. A listing scores 100 when it is a chosen occupation, 50 when it is another role of a chosen role's family, 0 otherwise, and 50 when no occupation is chosen. The title decides when it names a known role; the listing body is read only when the title doesn't. English **and** Hebrew terms and synonyms match for every role.
3. The overall score is a fixed weighted combination of stored sub-scores; recomputing it from the database reproduces the same number.
4. Results are sorted strictly descending by overall score.
5. Every listing shows at least one matched point and, below 100, at least one gap point. When nothing in the listing matches the search, it says so plainly above its gaps instead of inventing a match. Every quote is a verbatim substring of the listing text (title and location line included), including Hebrew listings.

### Daily use
6. A user can save a search; a scheduled job reruns every saved search once a day and the user sees only listings not seen before ("new since last visit").
7. The profile holds the master resume, or, without one, a written description of the user's skills of at least 200 characters. It is stored once and reused by every search and gap analysis. A search can't start without one of the two: the API refuses it with a message pointing to the profile, and the search form says so before submitting. Tailoring (criteria 9–11) needs the master resume itself, since every tailored line must trace back to it.
8. An application moves through states `saved → applied → follow_up → interview → offer | rejected`, each change timestamped.

### ATS resume tailoring
9. A tailored resume is exported as a text-selectable PDF (and DOCX on request): single column, standard section headings, no tables or images.
10. Every line in a tailored resume traces back to a line of the master resume or to a verified learning proof (criterion 13). A line with neither is rejected by code, not by prompt.
11. The app shows keyword coverage of the listing before and after tailoring, computed in code.

### Skill-gap learning
12. For a gap point on a listing, the user can open a learning path: short concepts, links to official resources, a quiz with a pass threshold, and a mini-project.
13. A skill is added to a tailored resume only after the quiz is passed **and** the mini-project (GitHub link) passes an automated rubric. It is added in the Projects/Training section with the project link, never as a core skill at the same level as real experience.

### Business and analytics
14. Free and Pro plans are enforced server-side through quotas; a free user exceeding a quota gets a clear upgrade message, never a silent failure.
15. Each search records its cost (Apify results, LLM tokens). The admin page shows active users per day and average cost per user per plan.
16. Analytics events load only after cookie consent. Resume text and form inputs are never sent to the analytics provider (session replay masks all inputs).

### Abuse protection
17. Every user-supplied text sent to an LLM (resume, skills description, intent, quiz answers, mini-project code) passes an injection check first. A detected attempt rejects that request with a short explanation of the rule, without revealing how detection works.
18. Three detections within 24 hours block the account's AI features for 24 hours. The user sees why and until when. Each detection is logged in `event`, and an admin can review and lift a block from `/admin`.
19. A deliberate injection placed in a resume or in mini-project code cannot change a score, add a resume line or pass a rubric. Covered by automated tests with known injection samples.

### Mobile first
20. Every screen works at 360 px wide with no horizontal scroll, touch targets of at least 44 px, and resume upload from the phone's file picker.
21. Lighthouse mobile score of at least 90 for performance and accessibility on the main screens (search results, job detail, resume library).
22. The app is installable as a PWA, and Pro users can opt in to a push notification for new matches from the daily run.

### Resume library
23. Every tailored resume is stored as a version linked to its listing and application. A "My resumes" page lists them all, grouped by company and job, filterable by application status.
24. On a job page that already has a tailored resume, one tap opens or downloads it; generating again creates a new version, never overwrites the previous one.

### Reference-measured (manual)
25. With a real resume and real criteria, at least 3 of the top 5 listings have correct location/occupation and defensible match/gap points.
26. At least one tailored resume, reviewed by the user, reads as truthful and better aligned to the listing than the master version.

### Occupations
28. The occupation search bar suggests matching families and roles on every keystroke, in English or Hebrew, from synonyms as well as names, without a server call per keystroke. Typed text that matches nothing can still be submitted as a free-text occupation.

### Accounts
27. An email/password account cannot sign in until its email is verified with a 6-character code sent to that address. The code uses uppercase letters and digits without ambiguous characters (`0 O 1 I L`), is case-insensitive on entry, stored hashed, expires after 15 minutes and is invalidated after 5 wrong attempts. Resending is limited to once per minute and 5 times per hour. An unverified account claims nothing: a Google sign-in or a new verified signup with the same email replaces it. Google accounts skip this step.

## Part 3 — Architecture

### Stack
- **Backend:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2 (async), Alembic, httpx. Tests with pytest; lint and format with ruff; types with mypy.
- **Frontend:** React, TypeScript, Vite, React Router, TanStack Query, Tailwind, shadcn/ui. UI components ported from v1 where possible. API types generated from FastAPI's OpenAPI schema with `openapi-typescript`, never written by hand.
- **Database:** PostgreSQL. JSONB for raw scraper output, `pg_trgm` for fuzzy cross-source deduplication. `pgvector` reserved for later semantic matching.
- **Auth:** Google OAuth (Authlib) and email/password (argon2). Session in an httpOnly cookie. One email = one auth method, as in v1, counted only once the email is verified (criterion 27). Verification codes go out through the email port.
- **Documents:** HTML template → PDF with WeasyPrint; DOCX with python-docx.
- **AI:** LLM calls through OpenRouter, model set in config. Concurrency limited in code (semaphore and queue), never unbounded.
- **Job data:** seven boards through Apify actors behind one adapter layer. The chosen occupations' English and Hebrew terms are the search keywords sent to each board. Chosen after paid trial runs on real listings (October 2026):

| Board | Actor | Listing text |
|---|---|---|
| Drushim | `bovi/drushim-co-il-scraper` | full (description and requirements) |
| AllJobs | `amrameng/israeli-job-boards-scraper` | full |
| JobNet | `amrameng/israeli-job-boards-scraper` | partial (cut at 600 characters), no employer |
| Ethosia | `amrameng/israeli-job-boards-scraper` | partial (short) |
| JobMaster | `swerve/jobmaster-scraper` | partial (about 160-character excerpt) |
| LinkedIn | to choose and trial with its adapter | ? |
| Indeed-IL | to choose and trial with its adapter | ? |

  GotFriends is left out for now: the multi-board actor read its listings but kept none for a Hebrew keyword. The adapter counts listings per board and reports an empty or failed board to the user, never trusting the actor's own status: in the trial the multi-board actor reported success while Drushim had failed. A listing from a board that gives partial text says so, with a link to the full listing, since its skills fit rests on less text.
- **Occupation taxonomy:** a versioned data file in the repo (families, roles, English and Hebrew names, synonyms, about 25 families aligned with the Israeli boards' categories), read by `api` to serve the search bar and by `matching-worker` to score. Adding a role is a data change, never a code change. Free-text occupations that users submit often are reviewed to grow it. Apify runs report completion by webhook rather than a process waiting on them.

### Deployment (provider-agnostic)
The app does not depend on any cloud provider. The hosting provider is chosen when phase 2 needs a public deployment (see Open decisions); until then everything runs locally.

- **Services are standard Docker images**, one per service, configured only through environment variables (12-factor). Nothing in application code imports a provider SDK directly.
- **Four ports, each with swappable adapters**, selected by config:

| Port | Interface | Local adapter | Production adapters (pick with the provider) |
|---|---|---|---|
| Message queue | `publish(event)`, `consume(handler)` | Redis | Azure Queue Storage, AWS SQS, Google Pub/Sub, or Redis on a VPS |
| File storage | `put`, `get`, `signed_url` | MinIO (S3 API) | Any S3-compatible store (S3, R2, MinIO), Azure Blob, Google Cloud Storage |
| Scheduler | the daily job is a command (`python -m app.jobs.daily`) | Run by hand or by a compose profile | Cloud Scheduler, Container Apps Job, EventBridge, or cron on a VPS |
| Email | `send(to, subject, text, html)` | Mailpit (catches every email, web UI) | Resend (chosen; free tier, cost per email beyond it) |

- **Database:** Neon (serverless PostgreSQL, free tier without expiry, independent of any cloud). Local: PostgreSQL in docker compose. Moving host later is a `pg_dump`/`pg_restore`, not a migration.
- **Frontend:** static build (Vite), deployable to any static host or CDN.
- **Observability:** OpenTelemetry for traces, metrics and logs, with a correlation id on every event; the exporter (Azure Monitor, Cloud Trace, Grafana, Sentry…) is configuration.
- **Secrets:** environment variables injected by the platform's secret store; never in the repo or the image.
- **Infrastructure as code:** Terraform, which works with every candidate provider.
- **CI/CD:** GitHub Actions — lint, types, tests and image builds on every PR; deployment job added once the provider is chosen, with OIDC federation (no stored cloud credentials).
- **Local:** docker compose with `api`, `matching-worker`, `resume-renderer`, `postgres`, `redis`, `minio`, `mailpit` and `frontend`. The same images run in production.

### Services and boundaries
Modular monolith first, with three services extracted where load or dependencies genuinely diverge (Monolith First):

| Service | Owns | Why separate |
|---|---|---|
| `api` | identity, profile and master resume, saved searches, applications, resume library metadata, learning, billing, events, admin | Serves users; the core of the product |
| `matching-worker` | job sources (Apify adapter), deduplication, scoring (deterministic + LLM), injection check on listing text | Long, asynchronous, bursty work that must scale on its own |
| `resume-renderer` | ATS PDF and DOCX generation | Heavy system dependencies (WeasyPrint) kept out of the API image |

- **Inside `api`, modules have strict boundaries:** a module never touches another module's tables; it goes through that module's interface. Any module can later become a service without a rewrite.
- **Communication is asynchronous by events** over the queue: `search.requested`, `listing.scored`, `search.completed`, `resume.render_requested`, `resume.rendered`. Events are versioned Pydantic models in a shared `contracts` package; consumers are idempotent (an event processed twice has no extra effect).
- **One PostgreSQL instance, one schema per service.** Each service reads and writes only its own schema; data another service needs travels in events or through the owning service's API. A database per service is not worth the cost at this scale.
- **No synchronous chains:** a user request never waits on a call to another service. Long work returns a status the frontend polls (or receives by push).

### Analytics
- **Product analytics:** PostHog. Frontend events after consent; key events (`search_completed`, `resume_tailored`, `job_applied`, `learning_passed`) sent from the backend so ad blockers don't hide them. Users identified by internal id after login, never by email.
- **Internal events:** an `event` table (`user_id`, `type`, `metadata` JSONB, `created_at`) feeding an `/admin` page restricted to an admin role.
- **Ops:** alerts on error rate, failed queue messages and job failures, from the observability backend chosen with the provider.

### Abuse protection
- Defense in depth, in this order: (1) architecture — LLM output never becomes a fact without code verification, so an injection can at worst produce a rejected answer; (2) user text always passed to the LLM inside clear delimiters, as data, never as instructions; (3) detection — fast heuristics (known injection patterns) plus a cheap classifier call on suspicious inputs; (4) sanctions — reject, then temporary block (criteria 17–18).
- False positives are the main risk: a real resume can mention "prompt engineering" or "LLM guardrails". The classifier judges intent, not keywords, and every block is reviewable by an admin.
- Mini-project rubric relies on running automated tests against the submitted code where possible, not only on an LLM reading it, so comments aimed at the grader have no effect.
- Indirect injection: scraped listing text is untrusted too and gets the same delimiting.

### Mobile first
- Designed at 360 px first, then scaled up. Bottom navigation on phones, sticky primary action on job pages, PDF preview usable on a phone screen.
- PWA (manifest and service worker) for installation and web push. Web push on iOS requires the app to be added to the home screen.

### Resume library
- "My resumes" page grouped by company and job, with status filters and download.
- Job page shows the latest tailored version with one-tap open/download, plus version history.
- Later: when a new listing is very close to one already tailored, suggest reusing that version as a starting point.

### Plans (initial, adjustable)
| | Free | Pro |
|---|---|---|
| Searches | 3 per month | Daily saved searches, quota-capped |
| Tailored resumes | 1 per month | Unlimited, quota-capped |
| Learning paths | Preview | Full, with verified resume line |
| Application tracking | Yes | Yes |

### Data model (main tables, by owning service)
- `api` schema: `user` (with `ai_blocked_until`), `profile` (master resume text and parsed sections, or the skills description), `saved_search`, `search_run`, `application`, `tailored_resume` (versioned, linked to listing and application), `learning_path`, `learning_attempt`, `skill_proof`, `subscription`, `abuse_flag`, `event`.
- `matching` schema: `listing` (deduplicated across runs), `match` (scores and points per user × listing), `source_run` (cost and status per Apify run).
- `renderer` schema: `render_job` (status, output file location).
- Rendered files go to the file storage port, never into the database.

### Boundaries
- Deterministic scoring (location, occupation, seniority) stays in plain code and is unit-tested. Only skills fit, gap extraction, resume rewording, quiz generation and rubric checks go to the LLM.
- Scoring, tailoring and UI code never call Apify directly.
- Every LLM output that claims a fact about a listing or a resume is verified in code against the source text before it is stored.

## Part 4 — Delivery phases and validation

1. **Core v2:** new stack with the three services, event contracts and per-service schemas, mobile-first layout, injection check on every LLM input, auth, profile with stored resume, search, scoring fixes (Hebrew terms, distance-based location, Drushim location, bounded LLM concurrency), tests on deterministic scoring. *Done when criteria 1–5, 7, 17, 19, 20, 25, 27 and 28 pass.*
2. **Daily use:** saved searches, daily job, PWA and push notifications, temporary blocks and admin review, "new since last visit", application states, analytics and admin page. *Done when 6, 8, 15, 16, 18, 21 and 22 pass, and 10 real job seekers have used it for a week.*
3. **ATS tailoring:** PDF/DOCX export, keyword coverage before/after, resume library with versions. *Done when 9–11, 23, 24 and 26 pass.*
4. **Subscription:** plans, quotas, payment provider. *Done when 14 passes with a real test payment.*
5. **Learning:** paths, quiz, mini-project rubric, verified resume line. *Start only if phase 2 shows users coming back; build first the gaps that appear most often in real match data.*

## Part 5 — Known pitfalls

- All job sources are scrapers in a ToS gray area; they break silently and cost per result. Keep pulls bounded and degrade visibly when a source fails. Community actors have few users and can stop working without notice; recheck a board with a small capped run before blaming the pipeline.
- Hebrew listings: the model may answer in English, so quotes fail verification. Prompt for quotes in the listing's language and keep the code check strict.
- A tailored resume that overstates the candidate hurts the user in interview. Criterion 10 is enforced in code for this reason.
- A short course does not make someone proficient. Criterion 13's proof and placement rules exist so the resume stays defensible.
- LLM-generated course content can be wrong. Prefer linking official resources; generated material is limited to quizzes and checked against them.
- Per-user cost (Apify + LLM) can exceed a Pro subscription if unbounded. Quotas apply to every plan and the admin page tracks cost per user. With seven boards at five results each, Apify alone costs about $0.10–0.15 per search at October 2026 prices, before LLM calls.
- Payment: Stripe availability for an Israeli business is unclear. Check Stripe directly, or use a merchant of record (Paddle, Lemon Squeezy) or an Israeli acquirer (Cardcom, Tranzila) before building billing.
- Provider lock-in creeps in through SDK calls in business code. Keep every provider call behind the three ports; a test runs the full pipeline on the local adapters only.
- Privacy: Israel's Privacy Protection Law Amendment 13 has been in force since 14 August 2025, and GDPR applies to EU visitors. Publish a privacy policy, gate analytics behind consent, never log resume text, and let a user delete their account and data.
- Duplicate listings across sources and runs: deduplicate with fuzzy matching before scoring, or the user sees one job several times.
- Stale listings: recheck freshness before showing old results.
- Distributed failures: a lost or duplicated event must not corrupt state. Consumers are idempotent, failed messages go to a poison queue that is monitored, and every event carries a correlation id traced across services through OpenTelemetry.
- Over-eager abuse detection blocks honest users and kills retention. Start with warnings and a high threshold, track the false-positive rate on `/admin`, and tighten only with data.
- Mobile resume handling: phones often store resumes in Drive or WhatsApp. Test upload from both before calling mobile done.

## Open decisions

- Hosting provider for phase 2: Google Cloud Run (permanent monthly free tier, scale to zero), Azure Container Apps (student subscription is tied to the university account), AWS (most requested in Israeli job ads; free plan limited to 6 months of credits), or a VPS running docker compose (simplest).
- Payment provider.
- Pro price (first guess 15–20 $/month, against Teal+ at 29 $ and Jobscan at 49.95 $).
- Resume tailoring languages: English only first, or English and Hebrew.
- Learning proof outside tech (phase 5): criterion 13's mini-project with a GitHub link only fits technical skills. Decide what verifiable proof means for other occupations before building phase 5.
