import logging

from jobhunter.contracts.events import AnyEvent
from jobhunter.worker import run

QUEUE = "matching"
logger = logging.getLogger("matching_worker")


async def handle(event: AnyEvent) -> None:
    # Phase 1: fetch listings through the source adapter, deduplicate, score, then publish
    # `listing.scored` / `search.completed`. Business logic is Dan's to write.
    logger.info("received %s for search run %s", event.type, event.search_run_id)


if __name__ == "__main__":
    run(QUEUE, handle)
