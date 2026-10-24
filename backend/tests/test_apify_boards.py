"""Board mappers and the Apify job source, on items recorded from the October 2026 trial
runs (tests/fixtures/apify/). No network, no cost."""

import json
from datetime import date
from pathlib import Path

import pytest

from jobhunter.matching_worker.scoring.seniority import minimum_years
from jobhunter.matching_worker.sourcing import SourceQuery
from jobhunter.matching_worker.sourcing.apify_client import ApifyError
from jobhunter.matching_worker.sourcing.apify_source import ApifyJobSource
from jobhunter.matching_worker.sourcing.boards import JOBS, to_listing
from jobhunter.text import normalize

FIXTURES = Path(__file__).parent / "fixtures" / "apify"


def fixture(name: str) -> list[dict]:
    return json.loads((FIXTURES / f"{name}.json").read_text(encoding="utf-8"))


def test_drushim_items_become_complete_listings():
    listings = [to_listing("drushim", item) for item in fixture("drushim")]
    assert len(listings) == 3
    first = listings[0]
    assert first.id.startswith("drushim:")
    assert first.title == "דרוש/ה מפתח/ת Python בכיר/ה"
    assert first.location == "לוד"
    assert first.posted_at == date(2026, 10, 24)
    assert not first.partial_text
    # Description and requirements both make it into the text the quotes are checked on.
    assert "8+ שנות ניסיון" in first.raw_text


def test_direction_marks_from_drushim_do_not_hide_years_of_experience():
    data_dev = next(item for item in fixture("drushim") if item["title"] == "מפתח/ת דאטה")
    listing = to_listing("drushim", data_dev)
    assert "\u200e" in listing.raw_text  # kept in the text, so quotes stay verbatim
    assert minimum_years(normalize(listing.raw_text)) == 2


def test_multi_board_items_are_split_by_board_and_partial_boards_say_so():
    items = fixture("multi_board")
    alljobs = [to_listing("alljobs", i) for i in items if i["source"] == "alljobs"]
    jobnet = [to_listing("jobnet", i) for i in items if i["source"] == "jobnet"]
    assert len(alljobs) == 2 and not any(item.partial_text for item in alljobs)
    assert len(jobnet) == 2 and all(item.partial_text for item in jobnet)
    assert all(item.company is None for item in jobnet)  # JobNet hides employers


def test_items_without_a_title_are_refused():
    # The multi-board actor returned JobMaster items with no title in the trial.
    titleless = next(i for i in fixture("multi_board") if i["source"] == "jobmaster")
    with pytest.raises(ValueError):
        to_listing("jobmaster", titleless)


def test_jobmaster_items_from_its_own_actor_have_titles_but_partial_text():
    listings = [to_listing("jobmaster", item) for item in fixture("jobmaster")]
    assert listings[0].title == "מפתח /ת תוכנה Full Stack (.NET Core)"
    assert all(item.partial_text and item.posted_at is None for item in listings)


class FakeRunner:
    """Answers each actor with a recorded fixture, or fails it."""

    def __init__(self, answers: dict[str, list[dict] | Exception]):
        self.answers = answers
        self.inputs: dict[str, dict] = {}

    async def run(self, actor, run_input, *, max_charge_usd, timeout_seconds):
        self.inputs[actor] = run_input
        answer = self.answers[actor]
        if isinstance(answer, Exception):
            raise answer
        return answer, 0.01


def source(answers) -> tuple[ApifyJobSource, FakeRunner]:
    runner = FakeRunner(answers)
    return ApifyJobSource(runner, max_charge_per_run_usd=0.25, run_timeout_seconds=60), runner


QUERY = SourceQuery(keyword="מפתח", results_per_board=5)


async def test_every_board_reports_what_it_gave():
    job_source, runner = source(
        {
            "bovi/drushim-co-il-scraper": fixture("drushim"),
            "amrameng/israeli-job-boards-scraper": fixture("multi_board"),
            "swerve/jobmaster-scraper": fixture("jobmaster"),
        }
    )
    result = await job_source.fetch(QUERY)
    counts = {r.board: (r.status, r.listings) for r in result.boards}
    assert counts == {
        "drushim": ("ok", 3),
        "alljobs": ("ok", 2),
        "jobnet": ("ok", 2),
        "ethosia": ("ok", 1),
        "jobmaster": ("ok", 3),
    }
    assert len(result.listings) == 11
    assert result.cost_usd == pytest.approx(0.03)
    # The cost limit from settings reaches every actor (CLAUDE.md non-negotiable).
    assert runner.inputs["bovi/drushim-co-il-scraper"]["maxResults"] == 5
    assert runner.inputs["amrameng/israeli-job-boards-scraper"]["maxItemsPerSource"] == 5
    assert runner.inputs["swerve/jobmaster-scraper"]["maxItems"] == 5


async def test_a_failed_actor_marks_its_boards_failed_and_the_others_still_count():
    job_source, _ = source(
        {
            "bovi/drushim-co-il-scraper": ApifyError("run ended FAILED"),
            "amrameng/israeli-job-boards-scraper": fixture("multi_board"),
            "swerve/jobmaster-scraper": [],
        }
    )
    result = await job_source.fetch(QUERY)
    reports = {r.board: r for r in result.boards}
    assert (reports["drushim"].status, reports["drushim"].error) == ("failed", "run ended FAILED")
    assert reports["jobmaster"].status == "empty"
    assert reports["alljobs"].status == "ok"
    assert {listing.source for listing in result.listings} == {"alljobs", "jobnet", "ethosia"}


async def test_a_board_missing_from_a_successful_multi_board_run_is_empty_not_ok():
    # What the trial showed: the actor succeeded, but its Drushim part had failed.
    only_alljobs = [i for i in fixture("multi_board") if i["source"] == "alljobs"]
    job_source, _ = source(
        {
            "bovi/drushim-co-il-scraper": fixture("drushim"),
            "amrameng/israeli-job-boards-scraper": only_alljobs,
            "swerve/jobmaster-scraper": fixture("jobmaster"),
        }
    )
    reports = {r.board: r.status for r in (await job_source.fetch(QUERY)).boards}
    assert reports["jobnet"] == "empty" and reports["ethosia"] == "empty"


def test_every_board_of_every_job_has_a_mapper():
    # An empty item is refused by the board's mapper (ValueError); a board without a
    # mapper would fail on the registry lookup instead (KeyError).
    for job in JOBS:
        for board in job.boards:
            with pytest.raises(ValueError):
                to_listing(board, {})
