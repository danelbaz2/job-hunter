# Developing Job Hunter v2

The v1 Next.js app still sits at the repository root until v2 replaces it. v2 lives in `backend/` and `frontend/`. Read `SPEC.md` first.

## Layout

```
backend/                    Python 3.12, FastAPI, managed with uv
  src/jobhunter/
    api/                    `api` service (FastAPI app, its own `api` Postgres schema)
    matching_worker/        `matching-worker` service (consumes the `matching` queue)
    resume_renderer/        `resume-renderer` service (consumes the `rendering` queue)
    contracts/              versioned event models shared by the services
    ports/                  queue and storage interfaces
    adapters/               implementations picked from settings (memory, Redis…)
    jobs/daily.py           daily saved-search job, run by any scheduler
    worker.py               consumer loop shared by the two workers
  migrations/               Alembic migrations for the `api` schema
  Dockerfile                one target per service
frontend/                   React, TypeScript, Vite, Tailwind, TanStack Query, React Router
  src/api/schema.d.ts       generated from the backend OpenAPI schema; never edit by hand
docs/phase1-scoring-test-cases.md   test cases to write the deterministic scoring from
```

## Everything in Docker

```bash
docker compose up --build             # frontend http://localhost:5173, API http://localhost:8000/docs
docker compose run --rm migrate       # apply migrations
```

## Backend without Docker

```bash
cd backend
uv sync
uv run pytest
uv run ruff check . && uv run ruff format --check . && uv run mypy src
uv run uvicorn jobhunter.api.main:app --reload       # needs Postgres; /api/health says if it's unreachable
```

Configuration comes from `JH_*` environment variables (see `src/jobhunter/settings.py`).

## Frontend without Docker

```bash
cd frontend
npm install
npm run dev          # proxies /api to http://localhost:8000 (override with API_PROXY_TARGET)
npm run typecheck && npm run lint && npm run build
```

## After changing the API

Regenerate the frontend types, or CI's `api-contract` job fails:

```bash
cd backend && uv run python scripts/export_openapi.py > ../frontend/openapi.json
cd ../frontend && npm run gen:api
```

## Adding an event

1. Add the model in `backend/src/jobhunter/contracts/events.py` and include it in `AnyEvent`.
2. Bump `version` when changing an existing event's fields; old consumers must keep working.
3. Handlers stay idempotent: delivery is at-least-once.
