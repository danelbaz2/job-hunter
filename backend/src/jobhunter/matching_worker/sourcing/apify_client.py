"""Minimal Apify API client over httpx: start a run with a spending cap, wait for it, read
its dataset. Retries stay bounded (CLAUDE.md): at most 2 per call, only for network
errors, timeouts, 429, 5xx and failed runs; reading a finished run's items is retried
on that run, never by starting the paid actor again.

Phase 1 waits for a run by long-polling Apify (each request waits up to 60 s there).
Production may switch to Apify's completion webhook (SPEC Part 3) behind the same
`run` method.
"""

import asyncio
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

import httpx

API = "https://api.apify.com/v2"
MAX_RETRIES = 2
_WAIT_SECONDS = 60  # Apify's longest server-side wait per request
_RUNNING = {"READY", "RUNNING"}


class ApifyError(Exception):
    """A call failed and won't be retried (4xx, or retries used up)."""


class _Retryable(Exception):
    pass


class ApifyRunFailedError(ApifyError):
    def __init__(self, status: str) -> None:
        super().__init__(f"run ended {status}")
        self.status = status


@dataclass(frozen=True)
class _Run:
    id: str
    dataset_id: str
    cost_usd: float


class ApifyClient:
    def __init__(
        self,
        token: str,
        http: httpx.AsyncClient | None = None,
        *,
        backoff_seconds: float = 2.0,
    ) -> None:
        self._http = http or httpx.AsyncClient(timeout=_WAIT_SECONDS + 30)
        self._headers = {"Authorization": f"Bearer {token}"}
        self._backoff = backoff_seconds

    async def run(
        self,
        actor: str,
        run_input: dict[str, Any],
        *,
        max_charge_usd: float,
        timeout_seconds: int,
    ) -> tuple[list[dict[str, Any]], float]:
        """Run an actor to completion and return its items and what the run cost."""
        run = await self._retry(
            lambda: self._start_and_wait(actor, run_input, max_charge_usd, timeout_seconds)
        )
        items = await self._retry(lambda: self._items(run.dataset_id))
        return items, run.cost_usd

    async def aclose(self) -> None:
        await self._http.aclose()

    async def _start_and_wait(
        self, actor: str, run_input: dict[str, Any], max_charge_usd: float, timeout_seconds: int
    ) -> _Run:
        data = await self._call(
            "POST",
            f"/acts/{actor.replace('/', '~')}/runs",
            params={
                "timeout": timeout_seconds,
                "maxTotalChargeUsd": max_charge_usd,
                "waitForFinish": _WAIT_SECONDS,
            },
            json=run_input,
        )
        deadline = time.monotonic() + timeout_seconds + _WAIT_SECONDS
        while data["status"] in _RUNNING:
            if time.monotonic() > deadline:
                raise ApifyError("run did not finish in time")
            data = await self._call(
                "GET", f"/actor-runs/{data['id']}", params={"waitForFinish": _WAIT_SECONDS}
            )
        if data["status"] != "SUCCEEDED":
            raise _Retryable(ApifyRunFailedError(data["status"]))
        return _Run(
            id=data["id"],
            dataset_id=data["defaultDatasetId"],
            cost_usd=float(data.get("usageTotalUsd") or 0),
        )

    async def _items(self, dataset_id: str) -> list[dict[str, Any]]:
        response = await self._send(
            "GET", f"/datasets/{dataset_id}/items", params={"clean": "true", "format": "json"}
        )
        items: list[dict[str, Any]] = response.json()
        return items

    async def _call(self, method: str, path: str, **kwargs: Any) -> dict[str, Any]:
        data: dict[str, Any] = (await self._send(method, path, **kwargs)).json()["data"]
        return data

    async def _send(self, method: str, path: str, **kwargs: Any) -> httpx.Response:
        try:
            response = await self._http.request(method, API + path, headers=self._headers, **kwargs)
        except httpx.TransportError as e:  # network errors and timeouts
            raise _Retryable(ApifyError(type(e).__name__)) from e
        if response.status_code == 429 or response.status_code >= 500:
            raise _Retryable(ApifyError(f"HTTP {response.status_code}"))
        if response.status_code >= 400:
            raise ApifyError(f"HTTP {response.status_code}")
        return response

    async def _retry[T](self, call: Callable[[], Awaitable[T]]) -> T:
        for attempt in range(MAX_RETRIES + 1):
            try:
                return await call()
            except _Retryable as e:
                if attempt == MAX_RETRIES:
                    cause = e.args[0]
                    raise cause if isinstance(cause, ApifyError) else ApifyError(str(e)) from e
                await asyncio.sleep(self._backoff * 2**attempt)
        raise AssertionError("unreachable")
