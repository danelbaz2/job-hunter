import pytest
from pydantic import ValidationError

from jobhunter.matching_worker.listing import Listing, compose_raw_text
from jobhunter.matching_worker.points import (
    NOTHING_MATCHED,
    MatchPoint,
    QuoteNotInListingError,
    SearchCriteria,
    deterministic_points,
    quote_point,
    summary,
)
from jobhunter.matching_worker.scoring.occupation import ChosenOccupations


def listing(title: str, location: str = "", body: str = "", company: str = "Acme") -> Listing:
    return Listing(
        id="test-1",
        source="drushim",
        source_id="1",
        url="https://example.com/1",
        title=title,
        company=company,
        location=location,
        raw_text=compose_raw_text(title, company, location, body),
    )


def search(city=None, roles=(), levels=()) -> SearchCriteria:
    return SearchCriteria(
        city=city,
        occupations=ChosenOccupations(roles=frozenset(roles)),
        levels=frozenset(levels),
    )


def assert_all_quoted(item: Listing, points: list[MatchPoint]) -> None:
    # P5: every point quotes the listing word for word.
    for point in points:
        assert point.quote in item.raw_text


# Section 6 of docs/phase1-scoring-test-cases.md.
def test_p1_location_match_quotes_the_hebrew_city():
    item = listing("מפתח/ת בקאנד", location="תל אביב")
    points = deterministic_points(item, search(city="Tel Aviv"))
    assert [(p.kind, p.claim, p.quote) for p in points] == [("matched", "In Tel Aviv", "תל אביב")]
    assert_all_quoted(item, points)


def test_p2_far_location_is_a_gap_quoting_the_location():
    item = listing("Backend Developer", location="Haifa")
    [point] = deterministic_points(item, search(city="Tel Aviv"))
    assert (point.kind, point.claim, point.quote) == ("gap", "81 km from Tel Aviv", "Haifa")


def test_p3_unknown_location_gives_no_point():
    item = listing("Backend Developer", location="Springfield")
    assert deterministic_points(item, search(city="Tel Aviv")) == []


def test_p4_occupation_from_a_hebrew_body_term_quotes_its_sentence():
    item = listing(
        "Software Engineer",
        body="We build payments. פיתוח צד שרת ב-Python. Great team.",
    )
    [point] = deterministic_points(item, search(roles=["backend-developer"]))
    assert point.kind == "matched"
    assert point.claim == "Backend Developer role"
    assert point.quote == "פיתוח צד שרת ב-Python."
    assert_all_quoted(item, [point])


def test_p6_everything_at_100_gives_no_gap():
    item = listing("Junior Backend Developer", location="Tel Aviv")
    points = deterministic_points(
        item, search(city="Tel Aviv", roles=["backend-developer"], levels=["Junior"])
    )
    assert [p.kind for p in points] == ["matched", "matched", "matched"]
    assert_all_quoted(item, points)
    assert summary(points) is None


def test_quote_keeps_the_original_hebrew_with_its_gender_slash():
    item = listing("מפתח/ת בקאנד ג'וניור", location="רמת גן")
    points = deterministic_points(
        item, search(city="Tel Aviv", roles=["backend-developer"], levels=["Junior"])
    )
    # Matching ran on "מפתח בקאנד", but the quote is the title as written.
    assert {p.quote for p in points} == {"רמת גן", "מפתח/ת בקאנד ג'וניור"}
    assert_all_quoted(item, points)


def test_seniority_gap_quotes_the_experience_sentence():
    item = listing("Backend Developer", body="Requirements: 5+ years of experience. Python.")
    [point] = deterministic_points(item, search(levels=["Junior"]))
    assert point.kind == "gap"
    assert point.claim == "Senior position"
    assert point.quote == "Requirements: 5+ years of experience."


def test_one_step_seniority_gap_says_so():
    item = listing("Mid-Level Developer")
    [point] = deterministic_points(item, search(levels=["Junior"]))
    assert (point.kind, point.claim) == ("gap", "Mid-Level position, one step from yours")


def test_related_and_different_occupations_are_gaps():
    related = listing("Full Stack Developer")
    [point] = deterministic_points(related, search(roles=["backend-developer"]))
    assert (point.kind, point.claim) == (
        "gap",
        "Related role (Full Stack Developer), not the one you chose",
    )

    other = listing("Cashier")
    [point] = deterministic_points(other, search(roles=["backend-developer"]))
    assert (point.kind, point.claim, point.quote) == (
        "gap",
        "Different occupation (Cashier)",
        "Cashier",
    )


def test_nothing_matched_is_said_instead_of_inventing_a_match():
    item = listing("Cashier", location="Haifa")
    points = deterministic_points(item, search(city="Tel Aviv", roles=["backend-developer"]))
    assert points and all(p.kind == "gap" for p in points)
    assert summary(points) == NOTHING_MATCHED


def test_quote_point_refuses_a_quote_that_is_not_in_the_listing():
    item = listing("Backend Developer", body="Python and Postgres.")
    with pytest.raises(QuoteNotInListingError):
        quote_point(item, "matched", "Knows Kubernetes", "Kubernetes experience", "ai")
    with pytest.raises(QuoteNotInListingError):
        quote_point(item, "matched", "Empty", "   ", "ai")


def test_listing_text_must_contain_title_and_location():
    with pytest.raises(ValidationError, match="title"):
        Listing(id="x", source="drushim", source_id="1", url="u", title="Dev", raw_text="body")
    with pytest.raises(ValidationError, match="location"):
        Listing(
            id="x",
            source="drushim",
            source_id="1",
            url="u",
            title="Dev",
            location="Haifa",
            raw_text="Dev\nbody",
        )


def test_a_long_unpunctuated_text_is_quoted_as_a_short_window_around_the_term():
    # JobNet sends a whole listing as one line with no sentence ending.
    filler = "עבודה בצוות דינאמי ואחריות על תהליכים רבים בסביבה טכנולוגית מתקדמת " * 4
    body = filler + "ניסיון של 5 שנים לפחות בתחום " + filler
    item = listing("Support Lead", body=body)
    [point] = deterministic_points(item, search(levels=["Junior"]))
    assert point.quote in item.raw_text
    assert "5 שנים" in point.quote
    assert len(point.quote) <= 140
    assert point.quote == point.quote.strip()
