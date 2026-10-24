"""The Apify client against a fake Apify API: no network, no cost."""

import httpx
import pytest

from jobhunter.matching_worker.sourcing.apify_client import ApifyClient, ApifyError


class FakeApify:
    """Answers the three Apify calls the client makes, from scripted responses."""

    def __init__(self, run_statuses=("SUCCEEDED",), start_errors=(), item_errors=()):
        self.run_statuses = list(run_statuses)  # final status of each run started, in order
        self.start_errors = list(start_errors)  # HTTP status to answer the next starts with
        self.item_errors = list(item_errors)
        self.starts = 0
        self.item_reads = 0
        self.requests: list[httpx.Request] = []

    def handler(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        path = request.url.path
        if request.method == "POST" and path.endswith("/runs"):
            if self.start_errors:
                return httpx.Response(self.start_errors.pop(0))
            self.starts += 1
            return httpx.Response(200, json={"data": self._run("RUNNING")})
        if path.startswith("/v2/actor-runs/"):
            return httpx.Response(200, json={"data": self._run(self.run_statuses.pop(0))})
        if path.startswith("/v2/datasets/"):
            self.item_reads += 1
            if self.item_errors:
                return httpx.Response(self.item_errors.pop(0))
            return httpx.Response(200, json=[{"title": "Backend Developer"}])
        return httpx.Response(404)

    def _run(self, status: str) -> dict:
        return {
            "id": f"run{self.starts}",
            "status": status,
            "defaultDatasetId": f"ds{self.starts}",
            "usageTotalUsd": 0.012,
        }


def client_for(fake: FakeApify) -> ApifyClient:
    http = httpx.AsyncClient(transport=httpx.MockTransport(fake.handler))
    return ApifyClient("apify_api_test", http, backoff_seconds=0)


async def run(client: ApifyClient):
    return await client.run(
        "bovi/drushim-co-il-scraper", {"searchTerm": "x"}, max_charge_usd=0.25, timeout_seconds=60
    )


async def test_runs_the_actor_with_a_spending_cap_and_returns_items_and_cost():
    fake = FakeApify()
    items, cost = await run(client_for(fake))
    assert items == [{"title": "Backend Developer"}]
    assert cost == 0.012
    start = fake.requests[0]
    assert start.url.path == "/v2/acts/bovi~drushim-co-il-scraper/runs"
    assert start.url.params["maxTotalChargeUsd"] == "0.25"
    assert start.headers["Authorization"] == "Bearer apify_api_test"


async def test_retries_a_server_error_when_starting():
    fake = FakeApify(start_errors=[503])
    items, _ = await run(client_for(fake))
    assert items and fake.starts == 1


async def test_does_not_retry_a_client_error():
    fake = FakeApify(start_errors=[400, 400, 400])
    with pytest.raises(ApifyError, match="HTTP 400"):
        await run(client_for(fake))
    assert len(fake.requests) == 1


async def test_a_failed_run_is_rerun_at_most_twice():
    fake = FakeApify(run_statuses=["FAILED", "FAILED", "FAILED"])
    with pytest.raises(ApifyError, match="FAILED"):
        await run(client_for(fake))
    assert fake.starts == 3  # the first run and 2 retries, no more


async def test_a_failed_run_then_a_good_one_succeeds():
    fake = FakeApify(run_statuses=["TIMED-OUT", "SUCCEEDED"])
    items, _ = await run(client_for(fake))
    assert items and fake.starts == 2


async def test_reading_items_is_retried_on_the_same_run_without_paying_again():
    fake = FakeApify(item_errors=[502, 429])
    items, _ = await run(client_for(fake))
    assert items
    assert fake.starts == 1  # never re-ran the paid actor
    assert fake.item_reads == 3


async def test_network_errors_are_retried_then_reported():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("down", request=request)

    http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    with pytest.raises(ApifyError, match="ConnectError"):
        await run(ApifyClient("apify_api_test", http, backoff_seconds=0))
