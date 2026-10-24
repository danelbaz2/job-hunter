import itertools
from dataclasses import dataclass
from datetime import date

import pytest

from jobhunter.matching_worker.scoring.overall import compute_overall_score, sort_matches


# One row of docs/phase1-scoring-test-cases.md, section 4, per case.
@pytest.mark.parametrize(
    ("location", "occupation", "seniority", "skills", "expected"),
    [
        pytest.param(100, 100, 100, 100, 100, id="W1-all-max"),
        pytest.param(100, 100, 50, 70, 81, id="W2-weighted"),
        pytest.param(100, 100, 50, None, 86, id="W3-skills-missing-renormalized"),
        pytest.param(50, 0, 0, 0, 13, id="W4-half-up-not-bankers"),
        pytest.param(0, 0, 0, 0, 0, id="W5-all-zero"),
        pytest.param(50, 100, 50, None, 68, id="W6-renormalized-rounding"),
        pytest.param(100, 0, 100, 90, 72, id="W7-weighted"),
    ],
)
def test_compute_overall_score(location, occupation, seniority, skills, expected):
    assert compute_overall_score(location, occupation, seniority, skills) == expected


@pytest.mark.parametrize("bad", [-1, 101])
def test_sub_score_out_of_range_is_an_error(bad):
    with pytest.raises(ValueError, match="out of range"):
        compute_overall_score(bad, 50, 50, 50)


STEPS = range(0, 101, 5)


def test_every_combination_is_in_range_and_reproducible():
    # Criterion 3: recomputing from stored sub-scores gives the stored score, every time.
    for location, occupation, seniority in itertools.product(STEPS, repeat=3):
        for skills in [None, *STEPS]:
            score = compute_overall_score(location, occupation, seniority, skills)
            assert 0 <= score <= 100
            assert score == compute_overall_score(location, occupation, seniority, skills)


def test_raising_a_sub_score_never_lowers_the_overall_score():
    for location, occupation, seniority in itertools.product(STEPS, repeat=3):
        for skills in [None, *STEPS]:
            base = compute_overall_score(location, occupation, seniority, skills)
            if location < 100:
                assert compute_overall_score(location + 5, occupation, seniority, skills) >= base
            if skills is not None and skills < 100:
                assert compute_overall_score(location, occupation, seniority, skills + 5) >= base


@dataclass(frozen=True)
class Match:
    overall_score: int
    posted_at: date | None
    listing_id: str


def order(*matches: Match) -> list[str]:
    return [m.listing_id for m in sort_matches(matches)]


# One row of section 5 per case.
def test_r1_score_descending():
    assert order(Match(70, None, "b"), Match(90, None, "a"), Match(80, None, "c")) == [
        "a",
        "c",
        "b",
    ]


def test_r2_tie_most_recent_first():
    assert order(Match(80, date(2026, 10, 1), "a"), Match(80, date(2026, 10, 15), "b")) == [
        "b",
        "a",
    ]


def test_r3_tie_missing_date_last():
    assert order(Match(80, None, "a"), Match(80, date(2026, 10, 1), "b")) == ["b", "a"]


def test_r4_tie_same_date_by_id():
    assert order(Match(80, date(2026, 10, 1), "b"), Match(80, date(2026, 10, 1), "a")) == [
        "a",
        "b",
    ]


def test_order_does_not_depend_on_input_order():
    matches = [
        Match(80, date(2026, 10, 1), "a"),
        Match(80, None, "b"),
        Match(95, date(2026, 9, 1), "c"),
        Match(80, date(2026, 10, 1), "d"),
        Match(80, date(2026, 10, 20), "e"),
    ]
    expected = order(*matches)
    assert expected == ["c", "e", "a", "d", "b"]
    for permutation in itertools.permutations(matches):
        assert order(*permutation) == expected
