"""Consumer loop shared by `matching-worker` and `resume-renderer`."""

import asyncio
import logging
from collections.abc import Awaitable, Callable

from pydantic import ValidationError

from jobhunter.adapters.factory import build_queue
from jobhunter.contracts.events import AnyEvent, parse_event
from jobhunter.ports import MessageQueue
from jobhunter.settings import get_settings

logger = logging.getLogger(__name__)

Handler = Callable[[AnyEvent], Awaitable[None]]


async def consume(
    queue: MessageQueue,
    queue_name: str,
    handler: Handler,
    *,
    stop: asyncio.Event,
    poll_seconds: float = 5.0,
) -> None:
    """Receive and handle events until `stop` is set.

    An invalid message is logged and dropped instead of crashing the worker. A failing
    handler is logged too; retries and the poison queue arrive with the production adapter.
    TODO(phase 1): make handlers idempotent by recording processed `event_id`s in the
    service's own schema, since delivery is at-least-once.
    """
    while not stop.is_set():
        raw = await queue.receive(queue_name, timeout_seconds=poll_seconds)
        if raw is None:
            continue
        try:
            event = parse_event(raw)
        except ValidationError:
            logger.error("dropping invalid message on %s", queue_name)
            continue
        try:
            await handler(event)
        except Exception:
            logger.exception(
                "handler failed for event %s (correlation %s)", event.event_id, event.correlation_id
            )


def run(queue_name: str, handler: Handler) -> None:
    """Entry point for a worker process."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

    async def main() -> None:
        queue = build_queue(get_settings())
        stop = asyncio.Event()
        logger.info("consuming %s", queue_name)
        try:
            await consume(queue, queue_name, handler, stop=stop)
        finally:
            await queue.close()

    asyncio.run(main())
