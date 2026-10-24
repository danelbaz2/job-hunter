import pytest

from jobhunter.matching_worker.scoring.occupation import ChosenOccupations, score_occupation


def roles(*ids: str) -> ChosenOccupations:
    return ChosenOccupations(roles=frozenset(ids))


def families(*ids: str) -> ChosenOccupations:
    return ChosenOccupations(families=frozenset(ids))


def free(*texts: str) -> ChosenOccupations:
    return ChosenOccupations(free_text=texts)


# One row of docs/phase1-scoring-test-cases.md, section 2, per case.
@pytest.mark.parametrize(
    ("chosen", "title", "text", "expected"),
    [
        pytest.param(
            roles("backend-developer"), "Backend Developer", "", 100, id="O1-english-title"
        ),
        pytest.param(roles("backend-developer"), "מפתח/ת בקאנד", "", 100, id="O2-hebrew-title"),
        pytest.param(
            roles("backend-developer"),
            "Software Engineer",
            "...פיתוח צד שרת ב-Python...",
            100,
            id="O3-generic-title-body-decides",
        ),
        pytest.param(
            roles("backend-developer"),
            "Software Engineer",
            "Build great products.",
            50,
            id="O4-generic-title-same-family",
        ),
        pytest.param(
            roles("backend-developer"), "Full Stack Developer", "", 50, id="O5-same-family"
        ),
        pytest.param(
            roles("backend-developer"),
            "Frontend Developer",
            "You'll work closely with the backend team.",
            50,
            id="O6-title-wins-over-body",
        ),
        pytest.param(
            roles("backend-developer"), "QA Automation Engineer", "", 0, id="O7-other-family"
        ),
        pytest.param(ChosenOccupations(), "QA Automation Engineer", "", 50, id="O8-nothing-chosen"),
        pytest.param(families("software"), "Full Stack Developer", "", 100, id="O9-whole-family"),
        pytest.param(roles("accountant"), "רואה/ת חשבון", "", 100, id="O10-hebrew-gender-slash"),
        pytest.param(roles("accountant"), "Accountant", "", 100, id="O11-non-tech-english"),
        pytest.param(roles("accountant"), "מנהל/ת חשבונות", "", 50, id="O12-non-tech-same-family"),
        pytest.param(roles("nurse"), "Nursery Assistant", "", 0, id="O13-latin-whole-words"),
        pytest.param(
            roles("sales-representative"),
            "Wholesale Coordinator",
            "",
            0,
            id="O14-sales-not-in-wholesale",
        ),
        pytest.param(roles("cook"), "עובד/ת מטבח", "", 50, id="O15-longest-hebrew-term-wins"),
        pytest.param(free("sommelier"), "Sommelier", "", 100, id="O16-free-text-in-title"),
        pytest.param(free("sommelier"), "Waiter", "We love wine.", 0, id="O17-free-text-absent"),
        pytest.param(
            free("glassblower"),
            "Workshop team member",
            "Experienced glassblower wanted.",
            100,
            id="O18-free-text-in-body",
        ),
        pytest.param(
            roles("truck-driver"), "Device Driver Engineer", "", 0, id="O19-device-driver"
        ),
        pytest.param(roles("teacher"), "מורה דרך", "", 0, id="O20-tour-guide-is-not-teacher"),
        pytest.param(
            roles("data-analyst"), "אנליסט/ית פיננסי/ת", "", 0, id="O21-financial-analyst"
        ),
        pytest.param(roles("caregiver"), "Caregiver", "", 100, id="O22-non-tech-role"),
    ],
)
def test_score_occupation(chosen, title, text, expected):
    assert score_occupation(chosen, title, text) == expected


def test_unknown_occupation_id_is_an_error():  # O23
    with pytest.raises(ValueError, match="astronaut"):
        score_occupation(roles("astronaut"), "Astronaut", "")


def test_generic_title_lets_the_body_pick_only_inside_its_family():  # O24
    # "QA Engineer" is generic, but "backend" in its body must not make it a Backend match.
    assert score_occupation(roles("backend-developer"), "QA Engineer", "Test our backend") == 0
