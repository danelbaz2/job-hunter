"""In-process adapters for tests and quick local runs. Not shared between processes."""

import asyncio
from collections import defaultdict

from jobhunter.contracts.events import Event


class InMemoryQueue:
    def __init__(self) -> None:
        self._queues: defaultdict[str, asyncio.Queue[str]] = defaultdict(asyncio.Queue)

    async def publish(self, queue: str, event: Event) -> None:
        await self._queues[queue].put(event.model_dump_json())

    async def receive(self, queue: str, timeout_seconds: float) -> str | None:
        try:
            return await asyncio.wait_for(self._queues[queue].get(), timeout=timeout_seconds)
        except TimeoutError:
            return None

    async def close(self) -> None:
        self._queues.clear()


class InMemoryStorage:
    def __init__(self) -> None:
        self._files: dict[str, tuple[bytes, str]] = {}

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        self._files[key] = (data, content_type)

    async def get(self, key: str) -> bytes:
        return self._files[key][0]
