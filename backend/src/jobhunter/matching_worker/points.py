"""Matched and gap points, each quoting the listing word for word (SPEC criterion 5).

`quote_point` is the only way to make a point: it refuses a quote that isn't a verbatim
substring of the listing text, Hebrew included. The deterministic points below are the
fallback when the AI step fails; the AI's own points go through the same check.
"""

import re
from collections.abc import Iterable
from dataclasses import dataclass, field
from typing import Literal

from pydantic import BaseModel, ConfigDict

from jobhunter.matching_worker.listing import Listing
from jobhunter.matching_worker.scoring.location import assess_location, resolve_city
from jobhunter.matching_worker.scoring.occupation import (
    ChosenOccupations,
    assess_occupation,
    role_name,
)
from jobhunter.matching_worker.scoring.seniority import Level, assess_seniority
from jobhunter.text import normalize

NOTHING_MATCHED = "Nothing in this listing matches your search."


class QuoteNotInListingError(ValueError):
    pass


class MatchPoint(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    kind: Literal["matched", "gap"]
    claim: str
    quote: str
    origin: Literal["deterministic", "ai"]


def quote_point(
    listing: Listing,
    kind: Literal["matched", "gap"],
    claim: str,
    quote: str,
    origin: Literal["deterministic", "ai"],
) -> MatchPoint:
    quote = quote.strip()
    if not quote or quote not in listing.raw_text:
        raise QuoteNotInListingError(f"quote not found in listing {listing.id}")
    return MatchPoint(kind=kind, claim=claim, quote=quote, origin=origin)


@dataclass(frozen=True)
class SearchCriteria:
    city: str | None = None
    occupations: ChosenOccupations = field(default_factory=ChosenOccupations)
    levels: frozenset[Level] = frozenset()


def deterministic_points(listing: Listing, criteria: SearchCriteria) -> list[MatchPoint]:
    """Points from the location, occupation and seniority sub-scores alone.

    A sub-score that couldn't be judged (unknown location, nothing chosen) gives no point
    rather than an invented one, and a listing at 100 everywhere gets no gap.
    """
    points: list[MatchPoint] = []
    for point in (
        _location_point(listing, criteria),
        _occupation_point(listing, criteria),
        _seniority_point(listing, criteria),
    ):
        if point is not None:
            points.append(point)
    return points


def summary(points: Iterable[MatchPoint]) -> str | None:
    """What the listing says above its gaps when nothing matched (SPEC criterion 5):
    an empty explanation is a bug, an invented match is worse."""
    return None if any(p.kind == "matched" for p in points) else NOTHING_MATCHED


def _location_point(listing: Listing, criteria: SearchCriteria) -> MatchPoint | None:
    assessment = assess_location(criteria.city, listing.location)
    if not listing.location:
        return None
    if assessment.remote:
        return quote_point(listing, "matched", "Remote position", listing.location, "deterministic")
    if assessment.city is None or assessment.distance_km is None or criteria.city is None:
        return None  # unknown location: neutral, no point
    search_city = _display(resolve_city(criteria.city) or criteria.city)
    km = round(assessment.distance_km)
    if assessment.score == 100:
        claim = f"In {search_city}"
    elif assessment.score >= 85:
        claim = f"Near {search_city} ({km} km)"
    else:
        return quote_point(
            listing, "gap", f"{km} km from {search_city}", listing.location, "deterministic"
        )
    return quote_point(listing, "matched", claim, listing.location, "deterministic")


def _occupation_point(listing: Listing, criteria: SearchCriteria) -> MatchPoint | None:
    if criteria.occupations.is_empty():
        return None
    a = assess_occupation(criteria.occupations, listing.title, listing.raw_text)
    quote = _segment_with(listing, a.evidence) if a.evidence else listing.title
    if quote is None:
        return None
    name = role_name(a.role) if a.role else None
    if a.score == 100:
        claim = f"{name} role" if name else f"Matches “{a.evidence}”"
        return quote_point(listing, "matched", claim, quote, "deterministic")
    if a.score == 50:
        claim = f"Related role ({name}), not the one you chose"
    else:
        claim = f"Different occupation ({name})" if name else "Not the occupation you chose"
    return quote_point(listing, "gap", claim, quote, "deterministic")


def _seniority_point(listing: Listing, criteria: SearchCriteria) -> MatchPoint | None:
    a = assess_seniority(criteria.levels, listing.title, listing.raw_text)
    if a.level is None or a.evidence is None:
        return None  # level unknown or none picked: neutral, no point
    quote = _segment_with(listing, a.evidence)
    if quote is None:
        return None
    if a.score == 100:
        return quote_point(listing, "matched", f"{a.level} position", quote, "deterministic")
    claim = f"{a.level} position, one step from yours" if a.score == 50 else f"{a.level} position"
    return quote_point(listing, "gap", claim, quote, "deterministic")


# Lines, then sentences inside a line. Each piece is a substring of the raw text, so it
# can be quoted as is, while matching ran on the normalized text.
_SENTENCE_END = re.compile(r"(?<=[.!?;])\s+")
_WORD = re.compile(r"\S+")
# Longest quote shown; a longer line or sentence is cut to a window of whole words around
# the matched term. Some boards send a whole listing as one unpunctuated line.
MAX_QUOTE_CHARS = 140


def _segment_with(listing: Listing, evidence: str) -> str | None:
    """A short verbatim piece of the raw text whose normalized form holds `evidence`: the
    first line or sentence that does, cut down to whole words around it when too long."""
    for line in listing.raw_text.splitlines():
        for segment in _SENTENCE_END.split(line):
            segment = segment.strip()
            if segment and evidence in normalize(segment):
                return segment if len(segment) <= MAX_QUOTE_CHARS else _window(segment, evidence)
    return None


def _window(segment: str, evidence: str) -> str:
    """The shortest run of whole words holding `evidence`, widened word by word on both
    sides while it fits MAX_QUOTE_CHARS. Always a substring of `segment`."""
    words = [(m.start(), m.end()) for m in _WORD.finditer(segment)]
    best: tuple[int, int] | None = None
    for i in range(len(words)):
        for j in range(i, len(words)):
            if evidence in normalize(segment[words[i][0] : words[j][1]]):
                if best is None or j - i < best[1] - best[0]:
                    best = (i, j)
                break
    if best is None:  # the term spans the whole segment's normalization oddly; keep it all
        return segment
    i, j = best
    while True:
        grown = False
        if j + 1 < len(words) and words[j + 1][1] - words[i][0] <= MAX_QUOTE_CHARS:
            j, grown = j + 1, True
        if i > 0 and words[j][1] - words[i - 1][0] <= MAX_QUOTE_CHARS:
            i, grown = i - 1, True
        if not grown:
            return segment[words[i][0] : words[j][1]]


def _display(city: str) -> str:
    return city.title()
