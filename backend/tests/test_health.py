import pytest
from httpx import ASGITransport, AsyncClient

from jobhunter.api.main import app, check_database


@pytest.fixture
async def client():
    # No lifespan here: the database check is overridden, so no engine is needed.
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


async def test_health_reports_ok_when_database_reachable(client):
    async def reachable() -> bool:
        return True

    app.dependency_overrides[check_database] = reachable
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


async def test_health_stays_up_and_says_so_when_database_is_down(client):
    async def unreachable() -> bool:
        return False

    app.dependency_overrides[check_database] = unreachable
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "unavailable"}
