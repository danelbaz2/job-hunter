import asyncio
from uuid import uuid4

import pytest
from pydantic import ValidationError

from jobhunter.adapters.memory import InMemoryQueue
from jobhunter.contracts.events import SearchRequested, parse_event
from jobhunter.worker import consume


def test_event_round_trips_through_json():
    event = SearchRequested(search_run_id=uuid4(), user_id=uuid4())
    assert parse_event(event.model_dump_json()) == event


def test_unknown_event_type_is_rejected():
    with pytest.raises(ValidationError):
        parse_event('{"type": "something.else"}')


async def test_queue_delivers_published_event():
    queue = InMemoryQueue()
    event = SearchRequested(search_run_id=uuid4(), user_id=uuid4())
    await queue.publish("matching", event)
    raw = await queue.receive("matching", timeout_seconds=1)
    assert raw is not None
    assert parse_event(raw) == event


async def test_receive_returns_none_on_empty_queue():
    assert await InMemoryQueue().receive("matching", timeout_seconds=0.01) is None


async def test_consumer_survives_invalid_message_and_failing_handler():
    queue = InMemoryQueue()
    stop = asyncio.Event()
    handled: list[SearchRequested] = []
    good = SearchRequested(search_run_id=uuid4(), user_id=uuid4())

    async def handler(event: SearchRequested) -> None:
        if not handled:
            handled.append(event)
            raise RuntimeError("first call fails")
        handled.append(event)
        stop.set()

    # An invalid message, then two valid ones: the first handler call fails, the second stops.
    await queue._queues["matching"].put("not json")
    await queue.publish("matching", good)
    await queue.publish("matching", good)

    await asyncio.wait_for(consume(queue, "matching", handler, stop=stop, poll_seconds=0.01), 2)
    assert handled == [good, good]
