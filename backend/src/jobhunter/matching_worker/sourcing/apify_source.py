"""`JobSource` backed by Apify actors: one run per actor job, all in parallel, and a report
per board so a board that failed or came back empty is shown to the user (SPEC Part 3).
"""

import asyncio
import logging
from collections import defaultdict
from typing import Any, Protocol

from jobhunter.matching_worker.listing import Listing
from jobhunter.matching_worker.sourcing import BoardReport, SourceQuery, SourcingResult
from jobhunter.matching_worker.sourcing.apify_client import ApifyClient, ApifyError
from jobhunter.matching_worker.sourcing.boards import JOBS, ActorJob, to_listing
from jobhunter.settings import Settings

logger = logging.getLogger(__name__)


class ActorRunner(Protocol):
    async def run(
        self,
        actor: str,
        run_input: dict[str, Any],
        *,
        max_charge_usd: float,
        timeout_seconds: int,
    ) -> tuple[list[dict[str, Any]], float]: ...


class ApifyJobSource:
    def __init__(
        self,
        runner: ActorRunner,
        *,
        max_charge_per_run_usd: float,
        run_timeout_seconds: int,
        jobs: tuple[ActorJob, ...] = JOBS,
    ) -> None:
        self._runner = runner
        self._max_charge = max_charge_per_run_usd
        self._timeout = run_timeout_seconds
        self._jobs = jobs

    async def fetch(self, query: SourceQuery) -> SourcingResult:
        outcomes = await asyncio.gather(*(self._run(job, query) for job in self._jobs))
        listings = tuple(listing for found, _, _ in outcomes for listing in found)
        reports = tuple(report for _, job_reports, _ in outcomes for report in job_reports)
        for report in reports:
            if report.status != "ok":
                logger.warning(
                    "board %s %s (%s)", report.board, report.status, report.error or "no listing"
                )
        return SourcingResult(listings, reports, sum(cost for _, _, cost in outcomes))

    async def _run(
        self, job: ActorJob, query: SourceQuery
    ) -> tuple[list[Listing], list[BoardReport], float]:
        try:
            items, cost = await self._runner.run(
                job.actor,
                job.build_input(query),
                max_charge_usd=self._max_charge,
                timeout_seconds=self._timeout,
            )
        except ApifyError as e:
            failed = [BoardReport(board, "failed", error=str(e)) for board in job.boards]
            return [], failed, 0.0

        by_board: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
        for item in items:
            board = job.board_of(item)
            if board in job.boards:
                by_board[board].append(item)

        listings: list[Listing] = []
        reports: list[BoardReport] = []
        for board in job.boards:
            found, dropped = [], 0
            for item in by_board[board]:
                try:
                    found.append(to_listing(board, item))
                except (ValueError, KeyError):
                    dropped += 1
            listings.extend(found)
            # Judged on what we could use, not on the actor's own status: in the trial
            # the multi-board actor reported success while its Drushim scraper had failed.
            reports.append(BoardReport(board, "ok" if found else "empty", len(found), dropped))
        return listings, reports, cost


def build_apify_job_source(settings: Settings) -> ApifyJobSource:
    if settings.apify_token is None:
        raise RuntimeError("JH_APIFY_TOKEN is not set")
    return ApifyJobSource(
        ApifyClient(settings.apify_token.get_secret_value()),
        max_charge_per_run_usd=settings.apify_max_charge_per_run_usd,
        run_timeout_seconds=settings.apify_run_timeout_seconds,
    )
