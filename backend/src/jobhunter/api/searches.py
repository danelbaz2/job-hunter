from functools import cache
from importlib.resources import files

from fastapi import APIRouter

from jobhunter.contracts.results import SearchResults

router = APIRouter(prefix="/api/searches", tags=["searches"])


@cache
def _demo() -> SearchResults:
    # Built by scripts/build_demo_results.py from the listings recorded in the Apify trials.
    raw = files("jobhunter.api").joinpath("demo_results.json").read_text(encoding="utf-8")
    return SearchResults.model_validate_json(raw)


@router.get("/demo", response_model=SearchResults)
async def demo_results() -> SearchResults:
    """A sample search on real recorded listings, scored without the AI step. Free to call:
    no board or LLM is contacted."""
    return _demo()
