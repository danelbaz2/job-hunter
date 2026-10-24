from typing import Protocol

from jobhunter.contracts.events import Event


class MessageQueue(Protocol):
    """At-least-once delivery: a message can arrive twice, so consumers must be idempotent."""

    async def publish(self, queue: str, event: Event) -> None:
        """Send an event to a named queue."""
        ...

    async def receive(self, queue: str, timeout_seconds: float) -> str | None:
        """Wait up to `timeout_seconds` for the next message, returned as raw JSON.

        Returns None when the queue stayed empty. Parse with `contracts.parse_event`.
        """
        ...

    async def close(self) -> None: ...
