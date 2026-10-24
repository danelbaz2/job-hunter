"""Integrity of occupations.json. A broken taxonomy would mis-score every listing quietly."""

from collections import defaultdict

from jobhunter.occupations import load_taxonomy
from jobhunter.text import has_hebrew, normalize

taxonomy = load_taxonomy()
roles = [role for family in taxonomy.families for role in family.roles]


def test_ids_are_unique():
    family_ids = [family.id for family in taxonomy.families]
    role_ids = [role.id for role in roles]
    assert len(family_ids) == len(set(family_ids))
    assert len(role_ids) == len(set(role_ids))
    assert not set(family_ids) & set(role_ids)


def test_every_family_and_role_is_named_in_both_languages():
    for item in [*taxonomy.families, *roles]:
        assert item.en.strip() and not has_hebrew(item.en), item.id
        assert has_hebrew(item.he), item.id


def test_no_term_belongs_to_two_roles():
    # Otherwise a title would name two roles at once and the score would depend on which
    # one happened to be chosen.
    owners: defaultdict[str, set[str]] = defaultdict(set)
    for role in roles:
        for term in role.terms:
            owners[normalize(term)].add(role.id)
    shared = {term: ids for term, ids in owners.items() if len(ids) > 1}
    assert not shared


def test_no_term_is_empty_after_normalization():
    for role in roles:
        for term in role.terms:
            assert normalize(term), role.id


def test_each_family_has_at_most_one_generic_role():
    for family in taxonomy.families:
        assert sum(role.generic for role in family.roles) <= 1, family.id
