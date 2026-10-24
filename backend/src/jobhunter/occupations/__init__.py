"""Occupation taxonomy (SPEC criteria 2 and 28): families of roles, in English and Hebrew.

The data lives in occupations.json next to this file, so adding a role is a data change.
`api` serves it to the search bar; `matching-worker` scores listings with it.
"""

from functools import cache
from importlib.resources import files

from pydantic import BaseModel, ConfigDict, Field


class Role(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    id: str
    en: str
    he: str
    synonyms: tuple[str, ...] = ()
    generic: bool = Field(
        default=False,
        description="A title naming only this role is too broad to decide the occupation "
        '("Software Engineer", "Technician"), so the listing body is read as well.',
    )

    @property
    def terms(self) -> tuple[str, ...]:
        """Every name a listing may use for this role, not yet normalized."""
        return (self.en, self.he, *self.synonyms)


class Family(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    id: str
    en: str
    he: str
    roles: tuple[Role, ...]


class Taxonomy(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    version: int
    families: tuple[Family, ...]


@cache
def load_taxonomy() -> Taxonomy:
    raw = files(__package__).joinpath("occupations.json").read_text(encoding="utf-8")
    return Taxonomy.model_validate_json(raw)
