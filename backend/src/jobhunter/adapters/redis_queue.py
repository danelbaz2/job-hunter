from redis.asyncio import Redis

from jobhunter.contracts.events import Event


class RedisQueue:
    """Local and VPS queue: one Redis list per queue (LPUSH to publish, BRPOP to receive).

    BRPOP removes the message as soon as it is read, so a worker crash mid-handler loses it.
    Good enough for local development; the production adapter (or a Redis Streams version
    with acknowledgements) must keep a message until it is handled, and route repeated
    failures to a poison queue (SPEC Part 5, distributed failures).
    """

    def __init__(self, url: str) -> None:
        self._redis: Redis = Redis.from_url(url, decode_responses=True)

    async def publish(self, queue: str, event: Event) -> None:
        await self._redis.lpush(queue, event.model_dump_json())

    async def receive(self, queue: str, timeout_seconds: float) -> str | None:
        item = await self._redis.brpop([queue], timeout=timeout_seconds)
        if item is None:
            return None
        _queue_name, payload = item
        return str(payload)

    async def close(self) -> None:
        await self._redis.aclose()
