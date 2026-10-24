from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import Depends, FastAPI, Request
from pydantic import BaseModel

from jobhunter.api import occupations
from jobhunter.api.db import database_is_reachable, make_engine
from jobhunter.settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    engine = make_engine(get_settings().database_url)
    app.state.engine = engine
    yield
    await engine.dispose()


app = FastAPI(title="Job Hunter API", version="0.1.0", lifespan=lifespan)
app.include_router(occupations.router)


class HealthResponse(BaseModel):
    status: Literal["ok"]
    database: Literal["ok", "unavailable"]


async def check_database(request: Request) -> bool:
    return await database_is_reachable(request.app.state.engine)


@app.get("/api/health", response_model=HealthResponse, tags=["system"])
async def health(database_ok: bool = Depends(check_database)) -> HealthResponse:
    """Liveness plus database reachability. The service stays up when the database is down,
    so the problem is visible here instead of as a crash loop."""
    return HealthResponse(status="ok", database="ok" if database_ok else "unavailable")
