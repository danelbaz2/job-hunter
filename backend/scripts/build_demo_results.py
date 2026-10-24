"""Score the listings recorded during the Apify trials and write the demo search results.

Runs the real sourcing mappers and scoring code on tests/fixtures/apify/, without the AI
step (so skills is None and the points are the deterministic fallback). No network, no
cost. Rerun after changing scoring:

    uv run python scripts/build_demo_results.py
"""

import asyncio
import json
from pathlib import Path
from typing import Any

from jobhunter.contracts.results import (
    BoardResult,
    ListingResult,
    ResultPoint,
    SearchResults,
    SearchSummary,
    SubScores,
)
from jobhunter.matching_worker.points import SearchCriteria, deterministic_points, summary
from jobhunter.matching_worker.scoring.location import assess_location
from jobhunter.matching_worker.scoring.occupation import ChosenOccupations, assess_occupation
from jobhunter.matching_worker.scoring.overall import compute_overall_score, sort_matches
from jobhunter.matching_worker.scoring.seniority import assess_seniority
from jobhunter.matching_worker.sourcing import SourceQuery
from jobhunter.matching_worker.sourcing.apify_source import ApifyJobSource

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests" / "fixtures" / "apify"
OUT = ROOT / "src" / "jobhunter" / "api" / "demo_results.json"

CRITERIA = SearchCriteria(
    city="Tel Aviv",
    occupations=ChosenOccupations(families=frozenset({"software"})),
    levels=frozenset({"Junior", "Mid-Level"}),
)
SUMMARY = SearchSummary(
    keyword="מפתח",
    city="Tel Aviv",
    occupations=["Software Development"],
    levels=["Junior", "Mid-Level"],
)
RECORDED = {
    "bovi/drushim-co-il-scraper": "drushim",
    "amrameng/israeli-job-boards-scraper": "multi_board",
    "swerve/jobmaster-scraper": "jobmaster",
}


class RecordedRunner:
    async def run(
        self, actor: str, run_input: dict[str, Any], **_: Any
    ) -> tuple[list[dict[str, Any]], float]:
        items = json.loads((FIXTURES / f"{RECORDED[actor]}.json").read_text(encoding="utf-8"))
        return items, 0.0


async def main() -> None:
    source = ApifyJobSource(RecordedRunner(), max_charge_per_run_usd=0.25, run_timeout_seconds=60)
    sourced = await source.fetch(SourceQuery(keyword=SUMMARY.keyword, results_per_board=5))

    results = []
    for listing in sourced.listings:
        sub = SubScores(
            location=assess_location(CRITERIA.city, listing.location).score,
            occupation=assess_occupation(
                CRITERIA.occupations, listing.title, listing.raw_text
            ).score,
            seniority=assess_seniority(CRITERIA.levels, listing.title, listing.raw_text).score,
        )
        points = deterministic_points(listing, CRITERIA)
        results.append(
            ListingResult(
                listing_id=listing.id,
                source=listing.source,
                url=listing.url,
                title=listing.title,
                company=listing.company,
                location=listing.location,
                posted_at=listing.posted_at,
                text=listing.raw_text,
                partial_text=listing.partial_text,
                overall_score=compute_overall_score(
                    sub.location, sub.occupation, sub.seniority, None
                ),
                sub_scores=sub,
                points=[ResultPoint(**p.model_dump()) for p in points],
                summary=summary(points),
            )
        )

    demo = SearchResults(
        demo=True,
        search=SUMMARY,
        boards=[
            BoardResult(board=r.board, status=r.status, listings=r.listings, error=r.error)
            for r in sourced.boards
        ],
        results=sort_matches(results),
    )
    OUT.write_text(demo.model_dump_json(indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(results)} results written to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    asyncio.run(main())
