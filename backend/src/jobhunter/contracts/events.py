from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter


def _now() -> datetime:
    return datetime.now(UTC)


class Event(BaseModel):
    """Envelope every event carries (SPEC Part 3, Services and boundaries).

    - `event_id` makes consumers idempotent: a handler records the ids it has processed
      and skips one it has already seen.
    - `correlation_id` follows one user action across services, for tracing.
    - `version` lets a contract evolve without breaking consumers that run older code.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    event_id: UUID = Field(default_factory=uuid4)
    correlation_id: UUID = Field(default_factory=uuid4)
    occurred_at: datetime = Field(default_factory=_now)
    version: int = 1


class SearchRequested(Event):
    """Published by `api` (or the daily job) when a search must run. Consumed by `matching-worker`.

    Placeholder fields for the scaffold; phase 1 fills in the real search criteria.
    """

    type: Literal["search.requested"] = "search.requested"

    search_run_id: UUID
    user_id: UUID


# With a second event, turn this into a discriminated union so `parse_event` can rebuild
# any of them from the queue:
#     AnyEvent = Annotated[SearchRequested | ListingScored, Field(discriminator="type")]
AnyEvent = SearchRequested
_event_adapter: TypeAdapter[AnyEvent] = TypeAdapter(AnyEvent)


def parse_event(raw: str | bytes) -> AnyEvent:
    """Rebuild a typed event from its JSON form. Raises a validation error on unknown types."""
    return _event_adapter.validate_json(raw)
