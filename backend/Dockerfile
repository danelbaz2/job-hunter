# One Dockerfile, one target per service: docker build --target api|matching-worker|resume-renderer
FROM python:3.12-slim AS base
COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PYTHONUNBUFFERED=1
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY src ./src
RUN uv sync --frozen --no-dev
ENV PATH="/app/.venv/bin:$PATH"
RUN useradd --create-home app
USER app

FROM base AS api
COPY --chown=app alembic.ini ./
COPY --chown=app migrations ./migrations
EXPOSE 8000
CMD ["uvicorn", "jobhunter.api.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM base AS matching-worker
CMD ["python", "-m", "jobhunter.matching_worker"]

# Phase 3 adds WeasyPrint's system libraries (Pango, HarfBuzz) to this target only,
# which is why the renderer has its own image.
FROM base AS resume-renderer
CMD ["python", "-m", "jobhunter.resume_renderer"]
