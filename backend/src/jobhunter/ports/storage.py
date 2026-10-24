from typing import Protocol


class FileStorage(Protocol):
    """Where rendered resumes live. Never the database (SPEC Part 3, Data model)."""

    async def put(self, key: str, data: bytes, content_type: str) -> None: ...

    async def get(self, key: str) -> bytes:
        """Raise KeyError when the key doesn't exist."""
        ...
