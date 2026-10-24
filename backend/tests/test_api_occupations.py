import pytest
from httpx import ASGITransport, AsyncClient

from jobhunter.api.main import app
from jobhunter.occupations import load_taxonomy


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_returns_the_whole_taxonomy(client):
    response = await client.get("/api/occupations")
    assert response.status_code == 200
    body = response.json()
    assert len(body["families"]) == len(load_taxonomy().families)
    software = next(f for f in body["families"] if f["id"] == "software")
    backend = next(r for r in software["roles"] if r["id"] == "backend-developer")
    # The search bar matches synonyms too, in both languages (criterion 28).
    assert "צד שרת" in backend["synonyms"]
    assert backend["he"] == "מפתח בקאנד"


async def test_is_cacheable_by_the_browser(client):
    response = await client.get("/api/occupations")
    assert response.headers["cache-control"] == "public, max-age=3600"
    assert response.headers["etag"]


async def test_unchanged_taxonomy_answers_304_without_a_body(client):
    etag = (await client.get("/api/occupations")).headers["etag"]
    response = await client.get("/api/occupations", headers={"If-None-Match": etag})
    assert response.status_code == 304
    assert response.content == b""


async def test_stale_etag_gets_the_full_taxonomy(client):
    response = await client.get("/api/occupations", headers={"If-None-Match": '"stale"'})
    assert response.status_code == 200
    assert response.json()["families"]
