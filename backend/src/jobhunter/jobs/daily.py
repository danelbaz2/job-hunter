"""Daily saved-search run: `python -m jobhunter.jobs.daily`.

Phase 2: load every saved search and publish one `search.requested` event per search to
the `matching` queue. The scheduler (cron, Cloud Scheduler, Container Apps Job…) only
runs this command; it knows nothing else about the app.
"""

import logging

logger = logging.getLogger(__name__)


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    logger.info("daily job: no saved searches yet (arrives in phase 2)")


if __name__ == "__main__":
    main()
