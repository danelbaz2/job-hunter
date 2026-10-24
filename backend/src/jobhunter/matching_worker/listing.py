"""A job listing in the one shape every source adapter produces; scoring knows only this."""

from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Listing(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    id: str
    # Board name, e.g. "alljobs" or "linkedin". Open on purpose: sources are added often.
    source: str = Field(pattern=r"^[a-z0-9-]+$")
    source_id: str
    url: str
    title: str = Field(min_length=1)
    company: str | None = None
    location: str = ""
    posted_at: date | None = None
    raw_text: str = Field(
        description="The full listing text as the user sees it, title and location line "
        "included. Every quote in an explanation must be a verbatim substring of it."
    )

    @model_validator(mode="after")
    def _title_and_location_are_quotable(self) -> "Listing":
        # Explanations quote the title and the location; both must be in the text the
        # quotes are checked against, even when a board leaves them out of the body.
        if self.title not in self.raw_text:
            raise ValueError("raw_text must contain the title")
        if self.location and self.location not in self.raw_text:
            raise ValueError("raw_text must contain the location")
        return self


def compose_raw_text(title: str, company: str | None, location: str, body: str) -> str:
    """What adapters store as `raw_text`: title, company, location and body, one per line."""
    parts = (title, company or "", location, body)
    return "\n".join(part.strip() for part in parts if part.strip())
