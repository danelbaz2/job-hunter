import pytest
from httpx import ASGITransport, AsyncClient

from jobhunter.api.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_demo_results_are_real_recorded_listings_best_first(client):
    response = await client.get("/api/searches/demo")
    assert response.status_code == 200
    body = response.json()
    assert body["demo"] is True
    scores = [r["overall_score"] for r in body["results"]]
    assert scores and scores == sorted(scores, reverse=True)
    assert {b["board"] for b in body["boards"]} >= {"drushim", "alljobs", "jobmaster"}


async def test_every_demo_point_quotes_its_listing(client):
    # SPEC criterion 5, checked on what the user actually sees.
    for result in (await client.get("/api/searches/demo")).json()["results"]:
        assert result["points"] or result["summary"]
        for point in result["points"]:
            assert point["quote"] in result["text"]
