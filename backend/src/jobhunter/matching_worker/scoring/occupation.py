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

    def roles_named_in(self, text: str) -> set[str]:
        """Roles whose terms appear in a normalized text, the most specific term winning.

        A match is dropped when its term sits inside a longer matched term, so
        "QA Automation Engineer" names QA automation and not plain QA, and "עובד מטבח"
        names kitchen worker and not cook ("טבח").
        """
        matched = [(term, role) for term, role in self.terms if contains_term(text, term)]
        return {
            role
            for term, role in matched
            if not any(term != other and term in other for other, _ in matched)
        }

    def body_names(self, text: str, roles: Collection[str]) -> bool:
        return any(contains_term(text, term) for term, role in self.terms if role in roles)


@cache
def _index() -> OccupationIndex:
    return OccupationIndex(load_taxonomy())


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
    if chosen.is_empty():
        return NEUTRAL_SCORE
    index = _index()
    accepted = index.accepted_roles(chosen)
    free_text = [term for term in (normalize(t) for t in chosen.free_text) if term]
    title, text = normalize(title), normalize(text)

    if any(contains_term(title, term) for term in free_text):
        return MATCH_SCORE
    title_roles = index.roles_named_in(title)
    if title_roles & accepted:
        return MATCH_SCORE
    specific = title_roles - index.generic
    if specific:
        return _family_score(index, specific, chosen.roles)

    if title_roles:  # only generic roles
        title_families = {index.family_of[role] for role in title_roles}
        in_scope = {role for role in accepted if index.family_of[role] in title_families}
        if index.body_names(text, in_scope):
            return MATCH_SCORE
        return _family_score(index, title_roles, chosen.roles)

    if index.body_names(text, accepted) or any(contains_term(text, t) for t in free_text):
        return MATCH_SCORE
    return NO_MATCH_SCORE


def _family_score(
    index: OccupationIndex, listing_roles: set[str], chosen_roles: frozenset[str]
) -> int:
    chosen_families = {index.family_of[role] for role in chosen_roles}
    if any(index.family_of[role] in chosen_families for role in listing_roles):
        return SAME_FAMILY_SCORE
    return NO_MATCH_SCORE
