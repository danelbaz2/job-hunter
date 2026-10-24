"""Seniority sub-score: plain code, never an LLM call.

The expected behavior is fixed by docs/phase1-scoring-test-cases.md, section 3; each row
of its table is one test in tests/test_scoring_seniority.py.
"""

import re
from collections.abc import Collection
from dataclasses import dataclass
from typing import Literal, get_args

from jobhunter.text import contains_term, normalize

Level = Literal["Junior", "Mid-Level", "Senior", "Team Lead"]
LEVELS: tuple[Level, ...] = get_args(Level)  # in order, one step apart

MATCH_SCORE = 100
ONE_STEP_SCORE = 50
NO_MATCH_SCORE = 0
NEUTRAL_SCORE = 50

# Only read in the title: in the body, "you'll work with senior engineers" says nothing
# about the listing's own level.
TITLE_TERMS: dict[Level, tuple[str, ...]] = {
    "Junior": (
        "junior", "jr", "entry level", "entry-level", "graduate", "student", "intern",
        "internship", "ג'וניור", "ג' וניור", "מתחיל", "ללא ניסיון", "סטודנט",
    ),
    "Mid-Level": ("mid level", "mid-level", "intermediate"),
    "Senior": ("senior", "sr", "principal", "בכיר", "סניור"),
    "Team Lead": (
        "team lead", "team leader", "tech lead", "lead engineer", "lead developer",
        "engineering manager", "ראש צוות",
    ),
}  # fmt: skip

# Read in the body too: these say how much experience the job asks for.
NO_EXPERIENCE_PHRASES = (
    "ללא ניסיון",
    "לא נדרש ניסיון",
    "אין צורך בניסיון",
    "no experience required",
    "no experience needed",
    "no prior experience",
)

_NUMBER_WORDS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    # Hebrew feminine forms, the ones used with שנים / שנות.
    "אחת": 1, "שתיים": 2, "שתי": 2, "שלוש": 3, "ארבע": 4, "חמש": 5,
    "שש": 6, "שבע": 7, "שמונה": 8, "תשע": 9, "עשר": 10,
}  # fmt: skip
_NUMBER = "|".join([r"\d{1,2}", *sorted(_NUMBER_WORDS, key=len, reverse=True)])
_RANGE_END = rf"(?:\s*(?:-|\u2013|to)\s*(?:{_NUMBER})\s*\+?)?"
# "3+ years", "3-5 years", "two years", "3 שנות", "שלוש שנים", "5 שנה"
_YEARS = re.compile(
    rf"(?<!\w)(?P<n>{_NUMBER})\s*(?:\+|plus)?{_RANGE_END}\s*(?:years?|yrs?|שנות|שנים|שנה)(?!\w)"
)
# Hebrew forms that carry their own number.
_FIXED_YEARS = {
    re.compile(r"(?<!\w)שנתיים(?!\w)"): 2,
    re.compile(r"(?<!\w)שנת ניסיון"): 1,
    re.compile(r"ניסיון של שנה(?!\w)"): 1,
}
_EXPERIENCE_WORDS = ("experience", "ניסיון", "נסיון")
# How far from a number of years the word "experience" may sit, in characters.
_CONTEXT_BEFORE, _CONTEXT_AFTER = 40, 60


@dataclass(frozen=True)
class SeniorityAssessment:
    score: int
    # The listing level that decided the score, and the normalized words that showed it.
    level: Level | None = None
    evidence: str | None = None


def score_seniority(levels: Collection[Level], title: str, text: str) -> int:
    """Whether the listing's level is the one the user is looking for.

    100 for one of the user's levels, 50 one step away (Junior vs Mid-Level), 0 further,
    and a neutral 50 when the listing's level can't be told or no level is picked. The
    title decides when it names a level; otherwise the minimum experience the body asks
    for does (0-2 years Junior, 3-4 Mid-Level, 5+ Senior).
    """
    return assess_seniority(levels, title, text).score


def assess_seniority(levels: Collection[Level], title: str, text: str) -> SeniorityAssessment:
    """`score_seniority` with the evidence behind it, for the explanation points."""
    unknown = set(levels) - set(LEVELS)
    if unknown:
        raise ValueError(f"unknown seniority levels: {sorted(unknown)}")
    if not levels:
        return SeniorityAssessment(NEUTRAL_SCORE)

    named = title_level_terms(normalize(title))
    if named:
        level = max(named, key=lambda lv: _score(lv, levels))
        return SeniorityAssessment(_score(level, levels), level=level, evidence=named[level])

    asked = years_asked(normalize(text))
    if not asked:
        return SeniorityAssessment(NEUTRAL_SCORE)
    years, phrase = min(asked, key=lambda found: found[0])
    level = level_for_years(years)
    return SeniorityAssessment(_score(level, levels), level=level, evidence=phrase)


def title_levels(title: str) -> set[Level]:
    return set(title_level_terms(title))


def title_level_terms(title: str) -> dict[Level, str]:
    """Levels a normalized title names, each with the first term that named it."""
    named: dict[Level, str] = {}
    for level, terms in TITLE_TERMS.items():
        for term in terms:
            if contains_term(title, normalize(term)):
                named[level] = normalize(term)
                break
    return named


def minimum_years(text: str) -> int | None:
    """The least experience a normalized body asks for, or None when it doesn't say."""
    return min((years for years, _ in years_asked(text)), default=None)


def years_asked(text: str) -> list[tuple[int, str]]:
    """Every (years, phrase) of experience a normalized body asks for."""
    found = [(0, phrase) for phrase in NO_EXPERIENCE_PHRASES if phrase in text]
    for match in _YEARS.finditer(text):
        if _near_experience(text, match.start(), match.end()):
            n = match["n"]
            found.append((int(n) if n.isdigit() else _NUMBER_WORDS[n], match[0]))
    for pattern, years in _FIXED_YEARS.items():
        for match in pattern.finditer(text):
            if _near_experience(text, match.start(), match.end()):
                found.append((years, match[0]))
    return found


def level_for_years(years: int) -> Level:
    if years <= 2:
        return "Junior"
    if years <= 4:
        return "Mid-Level"
    return "Senior"


def _near_experience(text: str, start: int, end: int) -> bool:
    window = text[max(0, start - _CONTEXT_BEFORE) : end + _CONTEXT_AFTER]
    return any(word in window for word in _EXPERIENCE_WORDS)


def _score(listing_level: Level, wanted: Collection[Level]) -> int:
    steps = min(abs(LEVELS.index(listing_level) - LEVELS.index(w)) for w in wanted)
    if steps == 0:
        return MATCH_SCORE
    if steps == 1:
        return ONE_STEP_SCORE
    return NO_MATCH_SCORE
