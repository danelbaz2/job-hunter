from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration from environment variables only (12-factor, SPEC Part 3).

    Adapters are picked here, so moving to another provider is a config change,
    never a code change in the services.
    """

    model_config = SettingsConfigDict(env_prefix="JH_", env_file=".env", extra="ignore")

    environment: Literal["local", "test", "production"] = "local"
    database_url: str = "postgresql+asyncpg://jobhunter:jobhunter@localhost:5432/jobhunter"

    queue_backend: Literal["memory", "redis"] = "memory"
    redis_url: str = "redis://localhost:6379/0"

    storage_backend: Literal["memory", "s3"] = "memory"


@lru_cache
def get_settings() -> Settings:
    return Settings()
