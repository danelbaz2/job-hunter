# Job Hunter

Multi-platform job matching app for Israel: aggregates listings via Apify scrapers, scores fit against the user's resume, and suggests resume edits.

**Read SPEC.md first, every session.** It is the "what to build" — goal, testable criteria, architecture boundaries, validation case, pitfalls. This file is standing context that doesn't change per feature; SPEC.md does.

## Non-negotiables (read these twice)

- Never let scoring or AI output claim a match/gap point that isn't actually present in the source listing text. Hallucinated fit claims break the app's entire value.
- Apify calls cost money per result. Never request more results than the current task needs — default to small, bounded pulls (see SPEC.md Part 4/5).
- Never invent qualifications in a resume suggestion. Suggestions must stay truthful to what's already in the user's resume.
- Never store or log a plaintext password. Hash with scrypt (salted) before it touches the database.

## Standards and processes

- Stack: Next.js, Postgres (Neon/Supabase), Auth.js (Google OAuth + email/password via Credentials provider), deployed on Vercel.
- One email can only be claimed by one auth method: whichever the account was created with wins. A Google sign-in attempt on a password-only email, or a password sign-in on a Google-only email, fails with a generic message pointing at the right method — never silently create a second account for the same email.
- All job sourcing goes through Apify actors (AllJobs, Drushim, LinkedIn, Indeed-Israel) behind one adapter layer. Scoring/UI code never calls Apify directly — swap actors without touching callers.
- Deterministic scoring (location, domain, seniority) is plain code, not an AI call. Only skills/resume-language fit goes through the OpenRouter AI call. Don't move deterministic scoring into a prompt "for simplicity" — it stops being testable.
- Resume flow is upload (PDF/DOCX) → parse to text → same pipeline as pasted text → text output only. No document regeneration; don't add file-output generation without discussing scope first.
- AI model is configured via OpenRouter, free-tier by default, swappable via config — don't hardcode a model name in application logic.

## What good work looks like

- Judge a change by whether it moves SPEC.md's Part 2 criteria closer to passing, not by whether code compiles or looks clean.
- A returned listing always shows at least one matched point, and a gap point unless the score is 100% — an empty explanation is a bug, not an edge case.
- Prefer a small pipeline that correctly handles 3-5 real listings over a broad one that handles many listings unreliably. This project's proof-of-concept bar is explicit in SPEC.md Part 4 — don't quietly raise it.
- When a source (Apify actor, resume parse, AI call) fails or returns nothing usable, degrade visibly to the user rather than silently dropping results.

## How work should be approached

- Treat SPEC.md as a hypothesis, not a fixed contract: after building toward it, note what the attempt revealed and propose a spec revision rather than silently deviating from it in code.
- Build in small turns aimed at one part of SPEC.md's criteria at a time; verify against the named validation case (Part 4) before moving to the next turn.
- When a decision isn't settled by SPEC.md, use its Part 1 reason (fast, trustworthy fit judgment over volume/coverage) to resolve it, and note the choice made.
- Prefer subtracting scope or context that's causing a wrong result over adding more instructions to compensate for it.

## When to stop and ask

- Before adding a new paid dependency, new Apify actor, or anything with a per-call cost not already named in SPEC.md.
- Before changing auth, data storage, or anything touching the user's resume/personal data.
- Before expanding scope beyond what SPEC.md Part 2 currently requires (e.g. moving from text-output resume suggestions to file regeneration).
- Before treating a contested/unclear point in SPEC.md as decided — surface the ambiguity instead of guessing silently.

## Maintaining this file

Write corrections here as rules, not complaints, the moment they're confirmed — this file starts empty every session, so anything not written here is lost. Keep it under 200 lines; if it grows past that, cut before adding.
