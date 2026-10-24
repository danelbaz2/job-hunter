"""Occupation sub-score (SPEC criterion 2): plain code, never an LLM call.

The expected behavior is fixed by docs/phase1-scoring-test-cases.md, section 2; each row
of its table is one test in tests/test_scoring_occupation.py.
"""

from collections.abc import Collection
from dataclasses import dataclass, field
from functools import cache

from jobhunter.occupations import Taxonomy, load_taxonomy
from jobhunter.text import contains_term, normalize

MATCH_SCORE = 100
# Another role of a chosen role's family: a Full Stack listing for a Backend search.
SAME_FAMILY_SCORE = 50
NO_MATCH_SCORE = 0
NEUTRAL_SCORE = 50


@dataclass(frozen=True)
class ChosenOccupations:
    """What the user picked in the search bar: whole families, single roles, free text."""

    families: frozenset[str] = field(default_factory=frozenset)
    roles: frozenset[str] = field(default_factory=frozenset)
    free_text: tuple[str, ...] = ()

    def is_empty(self) -> bool:
        return not (self.families or self.roles or self.free_text)


class OccupationIndex:
    """The taxonomy prepared for matching: normalized terms, and each role's family."""

    def __init__(self, taxonomy: Taxonomy) -> None:
        self.family_of: dict[str, str] = {}
        self.roles_of: dict[str, frozenset[str]] = {}
        self.generic: set[str] = set()
        self.terms: list[tuple[str, str]] = []  # (normalized term, role id)
        for family in taxonomy.families:
            self.roles_of[family.id] = frozenset(role.id for role in family.roles)
            for role in family.roles:
                self.family_of[role.id] = family.id
                if role.generic:
                    self.generic.add(role.id)
                for term in dict.fromkeys(normalize(t) for t in role.terms):
                    self.terms.append((term, role.id))

    def accepted_roles(self, chosen: ChosenOccupations) -> set[str]:
        """The chosen roles plus every role of the chosen families."""
        unknown = (chosen.families - self.roles_of.keys()) | (chosen.roles - self.family_of.keys())
        if unknown:
            # The search bar only offers ids from the taxonomy; anything else is a bug.
            raise ValueError(f"unknown occupation ids: {sorted(unknown)}")
        accepted = set(chosen.roles)
        for family in chosen.families:
            accepted |= self.roles_of[family]
        return accepted

    def named_in(self, text: str) -> dict[str, str]:
        """Roles whose terms appear in a normalized text, each with the term that named it.

        The most specific term wins: a match is dropped when its term sits inside a longer
        matched term, so "QA Automation Engineer" names QA automation and not plain QA, and
        "עובד מטבח" names kitchen worker and not cook ("טבח").
        """
        matched = [(term, role) for term, role in self.terms if contains_term(text, term)]
        named: dict[str, str] = {}
        for term, role in matched:
            if any(term != other and term in other for other, _ in matched):
                continue
            if len(term) > len(named.get(role, "")):
                named[role] = term
        return named

    def body_term(self, text: str, roles: Collection[str]) -> tuple[str, str] | None:
        """The first (term, role) of `roles` found in a normalized body, if any."""
        return next(
            (
                (term, role)
                for term, role in self.terms
                if role in roles and contains_term(text, term)
            ),
            None,
        )


@cache
def _index() -> OccupationIndex:
    return OccupationIndex(load_taxonomy())


@dataclass(frozen=True)
class OccupationAssessment:
    score: int
    # The normalized term that decided the score, and the role it names (None for free
    # text, or when nothing was found).
    evidence: str | None = None
    role: str | None = None


def score_occupation(chosen: ChosenOccupations, title: str, text: str) -> int:
    """Whether the listing is the occupation the user searched for (SPEC criterion 2).

    100 for a chosen occupation, 50 for another role of a chosen role's family, 0
    otherwise, and a neutral 50 when nothing is chosen. The title decides when it names a
    specific role, so "work with the backend team" in a Frontend listing's body doesn't
    make it a Backend match. The body is read only when the title names no role, or only
    a generic one like "Software Engineer"; a generic title lets the body pick a role of
    its own family only, so "QA Engineer" never becomes Backend because the body says
    "backend".
    """
    return assess_occupation(chosen, title, text).score


def assess_occupation(chosen: ChosenOccupations, title: str, text: str) -> OccupationAssessment:
    """`score_occupation` with the evidence behind it, for the explanation points."""
    if chosen.is_empty():
        return OccupationAssessment(NEUTRAL_SCORE)
    index = _index()
    accepted = index.accepted_roles(chosen)
    free_text = [term for term in (normalize(t) for t in chosen.free_text) if term]
    title, text = normalize(title), normalize(text)

    for term in free_text:
        if contains_term(title, term):
            return OccupationAssessment(MATCH_SCORE, evidence=term)
    named = index.named_in(title)
    for role, term in named.items():
        if role in accepted:
            return OccupationAssessment(MATCH_SCORE, evidence=term, role=role)
    specific = {role: term for role, term in named.items() if role not in index.generic}
    if specific:
        return _family_assessment(index, specific, chosen.roles)

    if named:  # only generic roles
        title_families = {index.family_of[role] for role in named}
        in_scope = {role for role in accepted if index.family_of[role] in title_families}
        hit = index.body_term(text, in_scope)
        if hit:
            return OccupationAssessment(MATCH_SCORE, evidence=hit[0], role=hit[1])
        return _family_assessment(index, named, chosen.roles)

    hit = index.body_term(text, accepted)
    if hit:
        return OccupationAssessment(MATCH_SCORE, evidence=hit[0], role=hit[1])
    for term in free_text:
        if contains_term(text, term):
            return OccupationAssessment(MATCH_SCORE, evidence=term)
    return OccupationAssessment(NO_MATCH_SCORE)


def role_name(role_id: str) -> str:
    """The English name of a taxonomy role, for explanations."""
    for family in load_taxonomy().families:
        for role in family.roles:
            if role.id == role_id:
                return role.en
    raise KeyError(role_id)


def _family_assessment(
    index: OccupationIndex, named: dict[str, str], chosen_roles: frozenset[str]
) -> OccupationAssessment:
    chosen_families = {index.family_of[role] for role in chosen_roles}
    for role, term in named.items():
        if index.family_of[role] in chosen_families:
            return OccupationAssessment(SAME_FAMILY_SCORE, evidence=term, role=role)
    role, term = next(iter(named.items()))
    return OccupationAssessment(NO_MATCH_SCORE, evidence=term, role=role)
