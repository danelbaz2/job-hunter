import pytest

from jobhunter.matching_worker.scoring.seniority import (
    minimum_years,
    score_seniority,
)
from jobhunter.text import normalize


# One row of docs/phase1-scoring-test-cases.md, section 3, per case.
@pytest.mark.parametrize(
    ("levels", "title", "text", "expected"),
    [
        pytest.param(["Junior"], "Junior Backend Developer", "", 100, id="S1-title-keyword"),
        pytest.param(["Junior"], "Senior Backend Engineer", "", 0, id="S2-two-steps-away"),
        pytest.param(
            ["Junior"],
            "Backend Developer",
            "You'll join a team of senior engineers.",
            50,
            id="S3-body-keyword-ignored",
        ),
        pytest.param(
            ["Junior"], "Backend Developer", "1+ years of experience with Python", 100, id="S4"
        ),
        pytest.param(["Junior"], "Backend Developer", "5+ years of experience", 0, id="S5"),
        pytest.param(
            ["Junior", "Mid-Level"],
            "Backend Developer",
            "3-5 years of experience",
            100,
            id="S6-range-minimum",
        ),
        pytest.param(
            ["Junior"], "מפתח/ת בקאנד", "ניסיון של שנתיים לפחות", 100, id="S7-hebrew-dual"
        ),
        pytest.param(["Junior"], "מפתח/ת בקאנד ג\u05f3וניור", "", 100, id="S8-geresh-u05f3"),
        pytest.param(["Junior"], "מפתח/ת בקאנד ג'וניור", "", 100, id="S9-apostrophe-geresh"),
        pytest.param(["Junior"], "Sr. Software Engineer", "", 0, id="S10-abbreviation"),
        pytest.param(["Junior"], "Software Engineer", "", 50, id="S11-nothing-found"),
        pytest.param(["Senior"], "מהנדס/ת תוכנה בכיר/ה", "", 100, id="S12-hebrew-senior"),
        pytest.param(["Junior"], "Team Lead, Backend", "", 0, id="S13-team-lead"),
        pytest.param(
            ["Junior"],
            "Junior Developer",
            "Requirements: 3+ years of experience",
            100,
            id="S14-title-wins-over-years",
        ),
        pytest.param(["Junior"], "Developer", "sr. management will review", 50, id="S15"),
        pytest.param(
            ["Junior"], "Backend Developer", "3+ years of experience", 50, id="S16-one-step"
        ),
        pytest.param(["Mid-Level"], "Junior Developer", "", 50, id="S17-one-step-down"),
        pytest.param(["Senior"], "Team Lead", "", 50, id="S18-lead-one-step"),
        pytest.param(
            ["Junior"],
            "מוכר/ת לחנות",
            "לא נדרש ניסיון, הכשרה במקום",
            100,
            id="S19-hebrew-no-experience",
        ),
        pytest.param(["Junior"], "Cashier", "No experience required.", 100, id="S20"),
        pytest.param(["Junior"], "Developer", "Founded 20 years ago.", 50, id="S21-no-context"),
        pytest.param(["Junior"], "Developer", "שלוש שנות ניסיון", 50, id="S22-hebrew-word"),
        pytest.param(
            ["Junior"], "Developer", "two years of experience", 100, id="S23-english-word"
        ),
        pytest.param([], "Senior Developer", "", 50, id="S24-no-level-picked"),
        pytest.param(
            ["Junior"], "Junior / Mid-Level Developer", "", 100, id="S25-best-title-level"
        ),
    ],
)
def test_score_seniority(levels, title, text, expected):
    assert score_seniority(levels, title, text) == expected


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("at least 3 years of experience", 3),
        ("3 שנות ניסיון בפיתוח", 3),
        ("ניסיון של 4 שנים לפחות", 4),
        ("שנת ניסיון אחת", 1),
        ("ניסיון של שנה בתחום", 1),
        ("2-3 years experience, or 5+ years for the senior track", 2),
        ("no experience needed, 3 years of experience is a plus", 0),
        ("we have been around for 30 years", None),
        ("", None),
    ],
)
def test_minimum_years(text, expected):
    assert minimum_years(normalize(text)) == expected


def test_unknown_level_is_an_error():
    with pytest.raises(ValueError, match="Wizard"):
        score_seniority(["Wizard"], "Developer", "")  # type: ignore[list-item]
