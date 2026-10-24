import pytest

from jobhunter.matching_worker.scoring.location import (
    CITY_ALIASES,
    CITY_COORDINATES,
    score_location,
)


# One row of docs/phase1-scoring-test-cases.md, section 1, per case. The id shows in the
# pytest output, so a failure names the row (and the v1 bug) it is about.
@pytest.mark.parametrize(
    ("search_city", "location", "expected"),
    [
        pytest.param("Tel Aviv", "Tel Aviv", 100, id="L1-same-city"),
        pytest.param("Tel Aviv", "תל אביב-יפו", 100, id="L2-hebrew-with-suffix"),
        pytest.param("Tel Aviv", "Petah Tikva, Israel", 85, id="L3-country-suffix"),
        pytest.param("Tel Aviv", "Herzliya", 85, id="L4-nearby-across-v1-regions"),
        pytest.param("Tel Aviv", "Netanya", 60, id="L5-one-step-further"),
        pytest.param("Tel Aviv", "Jerusalem", 40, id="L6-further"),
        pytest.param("Tel Aviv", "Haifa", 25, id="L7-far-stays-visible"),
        pytest.param("Tel Aviv", "באר שבע", 25, id="L8-hebrew-far"),
        pytest.param("Haifa", "Yokneam", 60, id="L9-any-search-city"),
        pytest.param("Tel Aviv", "Remote", 100, id="L10-remote"),
        pytest.param("Tel Aviv", "Hybrid - Tel Aviv", 100, id="L11-hybrid-resolves-to-city"),
        pytest.param("Tel Aviv", "", 50, id="L12-empty-is-neutral"),
        pytest.param("Tel Aviv", "Springfield", 50, id="L13-unknown-city-is-neutral"),
        pytest.param(None, "Haifa", 50, id="L14-no-search-city"),
        pytest.param("Tel Aviv", "ramat gan", 85, id="L15-case-insensitive"),
        pytest.param("Tel Aviv", 'פ"ת', 85, id="L16-hebrew-abbreviation"),
        pytest.param("Tel Aviv", "Tel Aviv / Haifa", 100, id="L17-closest-of-several"),
    ],
)
def test_score_location(search_city, location, expected):
    assert score_location(search_city, location) == expected


@pytest.mark.parametrize(
    "location",
    [
        "Jaffa",
        "יפו",
        "Ramat HaHayal",
        "רמת החייל",
        "Kiryat Atidim",
        "קריית עתידים",
        "Tel Aviv District",
        "מחוז תל אביב",
    ],
)
def test_tel_aviv_neighborhoods_and_district_count_as_tel_aviv(location):  # L19
    assert score_location("Tel Aviv", location) == 100


def test_unrecognized_location_is_logged_for_the_alias_table(caplog):  # L20
    with caplog.at_level("INFO"):
        score_location("Tel Aviv", "Springfield")
    assert "Springfield" in caplog.text


def test_empty_location_is_not_logged(caplog):
    with caplog.at_level("INFO"):
        score_location("Tel Aviv", "")
    assert caplog.text == ""


def test_unknown_search_city_is_an_error():  # L18
    with pytest.raises(ValueError, match="Atlantis"):
        score_location("Atlantis", "Haifa")


def test_hebrew_gershayim_matches_straight_quote():
    # Boards write abbreviations with the Hebrew gershayim (U+05F4) as often as with '"'.
    assert score_location("Tel Aviv", "פ״ת") == 85


def test_every_alias_points_to_a_city_with_coordinates():
    # A typo in CITY_ALIASES would otherwise crash scoring on the first listing using it.
    assert set(CITY_ALIASES.values()) <= set(CITY_COORDINATES)
