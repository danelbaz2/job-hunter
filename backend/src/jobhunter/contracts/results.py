"""The shape of search results, as `matching-worker` hands them to `api` and `api` serves
them to the frontend. Versioned like the events: change a field, bump `version`.
"""

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class _Frozen(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")


class ResultPoint(_Frozen):
    kind: Literal["matched", "gap"]
    claim: str
    quote: str = Field(description="Verbatim substring of the listing text (SPEC criterion 5).")
    origin: Literal["deterministic", "ai"]


class SubScores(_Frozen):
    location: int = Field(ge=0, le=100)
    occupation: int = Field(ge=0, le=100)
    seniority: int = Field(ge=0, le=100)
    skills: int | None = Field(
        default=None, ge=0, le=100, description="None when the AI step failed or didn't run."
    )


class ListingResult(_Frozen):
    listing_id: str
    source: str
    url: str
    title: str
    company: str | None
    location: str
    posted_at: date | None
    text: str = Field(description="The full listing text the quotes come from.")
    partial_text: bool
    overall_score: int = Field(ge=0, le=100)
    sub_scores: SubScores
    points: list[ResultPoint]
    summary: str | None = Field(
        default=None, description="Shown above the gaps when nothing matched (criterion 5)."
    )


class BoardResult(_Frozen):
    board: str
    status: Literal["ok", "empty", "failed"]
    listings: int
    error: str | None = None


class SearchSummary(_Frozen):
    keyword: str
    city: str | None
    occupations: list[str]
    levels: list[str]


class SearchResults(_Frozen):
    version: int = 1
    demo: bool = Field(
        default=False, description="Recorded listings scored without the AI step, for show."
    )
    search: SearchSummary
    boards: list[BoardResult]
    results: list[ListingResult] = Field(description="Best score first (criterion 4).")
