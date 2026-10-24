import hashlib
from functools import cache

from fastapi import APIRouter, Header, Response

from jobhunter.occupations import Taxonomy, load_taxonomy

router = APIRouter(prefix="/api/occupations", tags=["occupations"])

# The taxonomy only changes with a deploy. The browser keeps it for an hour, then asks
# again with If-None-Match and gets an empty 304 when nothing changed.
CACHE_CONTROL = "public, max-age=3600"


@cache
def _serialized() -> tuple[bytes, str]:
    body = load_taxonomy().model_dump_json().encode()
    etag = '"' + hashlib.sha256(body).hexdigest()[:16] + '"'
    return body, etag


@router.get("", response_model=Taxonomy)
async def list_occupations(if_none_match: str | None = Header(default=None)) -> Response:
    """The whole occupation taxonomy, for the search bar to filter on every keystroke
    without calling the server again (SPEC criterion 28)."""
    body, etag = _serialized()
    headers = {"ETag": etag, "Cache-Control": CACHE_CONTROL}
    if if_none_match == etag:
        return Response(status_code=304, headers=headers)
    return Response(content=body, media_type="application/json", headers=headers)
