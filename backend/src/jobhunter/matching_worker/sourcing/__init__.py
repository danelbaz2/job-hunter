"""Where listings come from. Scoring and the pipeline only see this module's types; the
Apify adapter behind `JobSource` is the only code that talks to a job board.
"""

from dataclasses import dataclass
from typing import Literal, Protocol

from jobhunter.matching_worker.listing import Listing

BoardStatus = Literal["ok", "empty", "failed"]


@dataclass(frozen=True)
class SourceQuery:
    keyword: str
    results_per_board: int


@dataclass(frozen=True)
class BoardReport:
    """What one board gave for a search, so a missing board is shown, never silent."""

    board: str
    status: BoardStatus
    listings: int = 0
    # Items the board returned that couldn't become a Listing (no title, no URL...).
    dropped: int = 0
    # Short and generic: an exception class or a run status, never a URL or a token.
    error: str | None = None


@dataclass(frozen=True)
class SourcingResult:
    listings: tuple[Listing, ...]
    boards: tuple[BoardReport, ...]
    cost_usd: float


class JobSource(Protocol):
    async def fetch(self, query: SourceQuery) -> SourcingResult: ...
