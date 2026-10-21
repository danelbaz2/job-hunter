import pytest
from pydantic import ValidationError

from jobhunter.settings import Settings


def test_cost_limits_default_to_the_values_in_claude_md(monkeypatch):
    monkeypatch.delenv("JH_APIFY_RESULTS_PER_SOURCE", raising=False)
    monkeypatch.delenv("JH_LLM_MAX_CONCURRENCY", raising=False)
    settings = Settings(_env_file=None)
    assert settings.apify_results_per_source == 5
    assert settings.llm_max_concurrency == 3


def test_cost_limits_are_read_from_the_environment(monkeypatch):
    monkeypatch.setenv("JH_APIFY_RESULTS_PER_SOURCE", "10")
    monkeypatch.setenv("JH_LLM_MAX_CONCURRENCY", "2")
    settings = Settings(_env_file=None)
    assert settings.apify_results_per_source == 10
    assert settings.llm_max_concurrency == 2


@pytest.mark.parametrize(
    ("variable", "value"),
    [
        ("JH_APIFY_RESULTS_PER_SOURCE", "500"),  # a typo for 50 must not reach Apify
        ("JH_APIFY_RESULTS_PER_SOURCE", "0"),
        ("JH_LLM_MAX_CONCURRENCY", "100"),
    ],
)
def test_out_of_range_cost_limits_are_rejected_at_startup(monkeypatch, variable, value):
    monkeypatch.setenv(variable, value)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)
