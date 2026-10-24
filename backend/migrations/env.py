import asyncio

from alembic import context
from sqlalchemy import text
from sqlalchemy.engine import Connection

from jobhunter.api.db import API_SCHEMA, Base, make_engine
from jobhunter.settings import get_settings

# Import model modules here as they are added, so autogenerate sees their tables.

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=get_settings().database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        version_table_schema=API_SCHEMA,
        include_schemas=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    # The version table lives in the service's own schema, so each service migrates alone.
    connection.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{API_SCHEMA}"'))
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        version_table_schema=API_SCHEMA,
        include_schemas=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = make_engine(get_settings().database_url)
    async with engine.begin() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
