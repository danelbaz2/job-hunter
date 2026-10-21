# Job Hunter

Job-search app for Israel: aggregates listings from several job boards, scores fit against the user's resume, tailors an ATS-friendly resume per listing, and helps close skill gaps with verifiable learning. v2 is a rebuild on FastAPI + React; the v1 Next.js app lives in git history.

**Read SPEC.md first, every session.** It is the "what to build": goal, testable criteria, architecture, delivery phases, pitfalls, open decisions. This file is standing context that doesn't change per feature; SPEC.md does.

## Non-negotiables (read these twice)

- Never let scoring or AI output claim a match/gap point that isn't present in the source listing text. Every quote is checked in code as a verbatim substring, Hebrew listings included.
- Never put anything in a tailored resume that doesn't trace back to the master resume or to a verified skill proof (SPEC criteria 10 and 13). This is enforced in code, not left to the prompt.
- Apify and LLM calls cost money. Defaults: at most 5 Apify results per source per search (`JH_APIFY_RESULTS_PER_SOURCE`) and at most 3 concurrent LLM calls (`JH_LLM_MAX_CONCURRENCY`), both set in config; raise them only with a reason written in the PR. Per-plan quotas apply on top (SPEC criterion 14).
- Every user text and every scraped listing reaches the LLM only inside delimiters, after the injection check, and never as instructions. A detection is logged; blocks are temporary (SPEC criterion 18: 3 detections in 24 h → 24 h block) and reviewable from `/admin`.
- Never store or log a plaintext password (argon2). Never log resume text, and never send it or form inputs to the analytics provider.

## Standards and processes

- Stack: FastAPI, Pydantic v2, SQLAlchemy 2 async, Alembic, PostgreSQL on the backend; React, TypeScript, Vite, TanStack Query, Tailwind, shadcn/ui on the frontend. Database on Neon. Provider-agnostic: queue, file storage and scheduler sit behind ports with swappable adapters (local: Redis, MinIO, a command). Local dev with docker compose.
- Never import a cloud provider SDK in business code; only an adapter behind a port may use one.
- Frontend API types are generated from the backend OpenAPI schema. Never hand-write a type that duplicates a backend model.
- One email can only be claimed by one auth method: whichever the account was created with wins. A mismatched sign-in fails with a generic message pointing at the right method; never silently create a second account.
- All job sourcing goes through Apify actors behind one adapter layer. Scoring, tailoring and UI code never call Apify directly.
- Deterministic scoring (location, domain, seniority) is plain, unit-tested code. Only skills fit, gap extraction, resume rewording, quiz generation and rubric checks go to the LLM. Don't move deterministic scoring into a prompt "for simplicity".
- LLM model is set in config through OpenRouter; never hardcode a model name in application logic.
- Mobile first: design every screen at 360 px before desktop; no horizontal scroll, touch targets of at least 44 px.
- Three services (`api`, `matching-worker`, `resume-renderer`), each with its own image and its own Postgres schema. A service never reads another service's schema; data crosses boundaries only through events (versioned Pydantic models in `contracts`) or the owning service's API. Event consumers are idempotent. Inside `api`, modules keep the same rule toward each other's tables.
- Key product events (`search_completed`, `resume_tailored`, `job_applied`, `learning_passed`; SPEC Part 3, Analytics) are sent from the backend, not only the frontend. Analytics loads only after cookie consent.

## What good work looks like

- Judge a change by whether it moves SPEC.md's Part 2 criteria closer to passing, not by whether code compiles or looks clean.
- A listing always shows at least one matched point, and a gap point unless the score is 100. An empty explanation is a bug.
- Prefer a small pipeline that handles a few real listings correctly over a broad one that handles many unreliably.
- When a source, resume parse or AI call fails, degrade visibly to the user rather than silently dropping results.
- Retries stay bounded on purpose: Apify at most 2 per source (reuse a successful run instead of re-running a paid actor); LLM at most 2 and only for network errors, timeouts, 429 and 5xx, never for 4xx or failed quote verification.
- Every new endpoint and every deterministic function ships with tests.

## How work should be approached

- Work one SPEC.md phase at a time; don't start a phase before the previous one's "done when" criteria pass.
- Treat SPEC.md as a hypothesis: when building reveals a problem, propose a spec revision instead of silently deviating in code.
- When SPEC.md doesn't settle a decision, use its Part 1 tie-breaker (truthful, verifiable resume and fit over volume or apparent fit) and note the choice.
- Dan writes the business logic himself (scoring, pipeline, tailoring rules) to keep his coding fluency. Scaffolding, configuration and review are where to help most; explain non-obvious code rather than dumping it.

## When to stop and ask

- Before adding a paid dependency, a new Apify actor, or anything with a per-call cost not named in SPEC.md.
- Before changing auth, billing, data storage, or anything touching resumes or personal data.
- Before settling anything listed under SPEC.md "Open decisions".
- Before expanding scope beyond the current phase.

## Maintaining this file

Write corrections here as rules, the moment they're confirmed; this file starts empty every session, so anything not written here is lost. Keep it under 200 lines; cut before adding.
