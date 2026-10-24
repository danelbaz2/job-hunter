"""Overall score and result order (SPEC criteria 3 and 4): plain code, never an LLM call.

The expected behavior is fixed by docs/phase1-scoring-test-cases.md, sections 4 and 5;
each row of their tables is one test in tests/test_scoring_overall.py.
"""

import math
from collections.abc import Iterable
from datetime import date
from fractions import Fraction
from typing import Protocol

# Integer weights, so the arithmetic below stays exact.
LOCATION_WEIGHT = 25
OCCUPATION_WEIGHT = 25
SENIORITY_WEIGHT = 20
SKILLS_WEIGHT = 30


def compute_overall_score(
    location: int, occupation: int, seniority: int, skills: int | None
) -> int:
    """The fixed weighted combination of the sub-scores, rounded half up.

    When skills is None (no resume, or the AI step failed), its weight is shared among
    the other three instead of counting as 0. The sum is a Fraction, not a float, so
    12.5 can't drift to 12.4999 and recomputing from the stored sub-scores always gives
    the stored result (criterion 3).
    """
    parts = [
        (LOCATION_WEIGHT, location),
        (OCCUPATION_WEIGHT, occupation),
        (SENIORITY_WEIGHT, seniority),
    ]
    if skills is not None:
        parts.append((SKILLS_WEIGHT, skills))
    for _, score in parts:
        if not 0 <= score <= 100:
            raise ValueError(f"sub-score out of range: {score}")
    weighted = Fraction(sum(w * s for w, s in parts), sum(w for w, _ in parts))
    # Half up, like v1's Math.round. Python's round() rounds half to even: round(12.5) == 12.
    return math.floor(weighted + Fraction(1, 2))


class Rankable(Protocol):
    @property
    def overall_score(self) -> int: ...

    @property
    def posted_at(self) -> date | None: ...

    @property
    def listing_id(self) -> str: ...


def sort_matches[T: Rankable](matches: Iterable[T]) -> list[T]:
    """Best overall score first (criterion 4); ties go to the most recent listing, then
    those without a date, then by listing id so the order never changes between views.

    Three stable sorts, from the last tie-breaker to the first, so each one keeps the
    order the previous one set among equal keys.
    """
    ranked = sorted(matches, key=lambda m: m.listing_id)
    ranked.sort(key=lambda m: (m.posted_at is not None, m.posted_at), reverse=True)
    ranked.sort(key=lambda m: m.overall_score, reverse=True)
    return ranked
