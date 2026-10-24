"""The boards we source from (SPEC Part 3, Job data): which actor serves each one, what it
is asked, and how its items become Listings. Field names come from the October 2026
trial runs, recorded in tests/fixtures/apify/.
"""

from collections.abc import Callable
from dataclasses import dataclass
from datetime import date
from typing import Any

from jobhunter.matching_worker.listing import Listing, compose_raw_text
from jobhunter.matching_worker.sourcing import SourceQuery

Item = dict[str, Any]

# Boards whose actor gives only part of the listing text.
PARTIAL_TEXT_BOARDS = frozenset({"jobnet", "ethosia", "jobmaster"})


@dataclass(frozen=True)
class ActorJob:
    """One actor run per search, serving one board or several."""

    actor: str
    boards: tuple[str, ...]
    build_input: Callable[[SourceQuery], dict[str, Any]]
    board_of: Callable[[Item], str | None]


def to_listing(board: str, item: Item) -> Listing:
    """Raises ValueError (or KeyError) when the item can't make a usable Listing."""
    return _MAPPERS[board](board, item)


def _listing(
    board: str,
    *,
    source_id: Any,
    url: Any,
    title: Any,
    company: Any,
    location: Any,
    posted_at: date | None,
    body: str,
) -> Listing:
    if not title or not url or source_id in (None, ""):
        raise ValueError("item lacks a title, a URL or an id")
    title, location = str(title).strip(), str(location or "").strip()
    company = str(company).strip() if company else None
    return Listing(
        id=f"{board}:{source_id}",
        source=board,
        source_id=str(source_id),
        url=str(url),
        title=title,
        company=company,
        location=location,
        posted_at=posted_at,
        raw_text=compose_raw_text(title, company, location, body),
        partial_text=board in PARTIAL_TEXT_BOARDS,
    )


def _date(value: Any) -> date | None:
    """A date from "2026-10-24" or "2026-10-22T18:46:54.014Z"; None when absent or odd."""
    try:
        return date.fromisoformat(str(value)[:10]) if value else None
    except ValueError:
        return None


def _drushim(board: str, item: Item) -> Listing:
    city = item.get("primaryCity") or ", ".join(item.get("cities") or [])
    if item.get("isRemote"):
        location = f"Remote, {city}" if city else "Remote"
    else:
        location = city
    company = None if item.get("isConfidential") else item.get("company")
    body = "\n".join(p for p in (item.get("description"), item.get("requirements")) if p)
    return _listing(
        board,
        source_id=item.get("jobId"),
        url=item.get("url"),
        title=item.get("title"),
        company=company,
        location=location,
        posted_at=_date(item.get("datePosted")),
        body=body,
    )


def _multi_board(board: str, item: Item) -> Listing:
    return _listing(
        board,
        source_id=item.get("externalJobId") or item.get("url"),
        url=item.get("url"),
        title=item.get("title"),
        company=item.get("companyName"),
        location=item.get("location"),
        posted_at=_date(item.get("postedDate")),
        body=item.get("description") or "",
    )


def _jobmaster(board: str, item: Item) -> Listing:
    return _listing(
        board,
        source_id=item.get("jobId"),
        url=item.get("url"),
        title=item.get("title"),
        company=item.get("company"),
        location=item.get("location"),
        posted_at=None,  # the actor gives no date
        body=item.get("description") or "",
    )


_MAPPERS: dict[str, Callable[[str, Item], Listing]] = {
    "drushim": _drushim,
    "alljobs": _multi_board,
    "jobnet": _multi_board,
    "ethosia": _multi_board,
    "jobmaster": _jobmaster,
}

# LinkedIn and Indeed-IL join once their actors are trialled (SPEC Part 3).
JOBS: tuple[ActorJob, ...] = (
    ActorJob(
        actor="bovi/drushim-co-il-scraper",
        boards=("drushim",),
        build_input=lambda q: {
            "searchTerm": q.keyword,
            "maxResults": q.results_per_board,
            "pagesToFetch": 1,
        },
        board_of=lambda item: "drushim",
    ),
    ActorJob(
        actor="amrameng/israeli-job-boards-scraper",
        boards=("alljobs", "jobnet", "ethosia"),
        build_input=lambda q: {
            "sources": ["alljobs", "jobnet", "ethosia"],
            "keywords": q.keyword,
            "maxItemsPerSource": q.results_per_board,
            "maxPagesPerSource": 1,
        },
        board_of=lambda item: item.get("source"),
    ),
    ActorJob(
        actor="swerve/jobmaster-scraper",
        boards=("jobmaster",),
        build_input=lambda q: {"keywords": [q.keyword], "maxItems": q.results_per_board},
        board_of=lambda item: "jobmaster",
    ),
)
