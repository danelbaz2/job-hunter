"""Location sub-score (SPEC criterion 1): plain code, never an LLM call.

The expected behavior is fixed by docs/phase1-scoring-test-cases.md, section 1; each row
of its table is one test in tests/test_scoring_location.py.
"""

import logging
import math
import re

from jobhunter.text import normalize

logger = logging.getLogger(__name__)

# Known cities and their coordinates (latitude, longitude), keyed by a canonical name.
CITY_COORDINATES: dict[str, tuple[float, float]] = {
    "tel aviv": (32.0853, 34.7818),
    "ramat gan": (32.0684, 34.8248),
    "givatayim": (32.0722, 34.8125),
    "bnei brak": (32.0807, 34.8338),
    "holon": (32.0158, 34.7874),
    "bat yam": (32.0171, 34.7454),
    "petah tikva": (32.0871, 34.8875),
    "rosh haayin": (32.0956, 34.9566),
    "or yehuda": (32.0306, 34.8572),
    "herzliya": (32.1663, 34.8436),
    "raanana": (32.1848, 34.8713),
    "kfar saba": (32.1750, 34.9070),
    "hod hasharon": (32.1500, 34.8917),
    "netanya": (32.3215, 34.8532),
    "rishon lezion": (31.9730, 34.7925),
    "ness ziona": (31.9293, 34.7987),
    "rehovot": (31.8928, 34.8113),
    "lod": (31.9510, 34.8881),
    "modiin": (31.8980, 35.0104),
    "jerusalem": (31.7683, 35.2137),
    "beit shemesh": (31.7470, 34.9881),
    "haifa": (32.7940, 34.9896),
    "yokneam": (32.6593, 35.1050),
    "caesarea": (32.4996, 34.8953),
    "karmiel": (32.9190, 35.2950),
    "nazareth": (32.6996, 35.3035),
    "beer sheva": (31.2520, 34.7915),
    "ashdod": (31.8044, 34.6553),
    "ashkelon": (31.6688, 34.5743),
}

# Other spellings, Hebrew names and abbreviations, already normalized
# (see `jobhunter.text.normalize`).
# The canonical names above resolve to themselves without being listed here.
CITY_ALIASES: dict[str, str] = {
    "tel-aviv": "tel aviv",
    "תל אביב": "tel aviv",
    "תל-אביב": "tel aviv",
    'ת"א': "tel aviv",
    # Neighborhoods inside Tel Aviv that boards give as the location.
    "jaffa": "tel aviv",
    "yafo": "tel aviv",
    "יפו": "tel aviv",
    "ramat hahayal": "tel aviv",
    "ramat hachayal": "tel aviv",
    "רמת החייל": "tel aviv",
    "kiryat atidim": "tel aviv",
    "קריית עתידים": "tel aviv",
    "קרית עתידים": "tel aviv",
    # LinkedIn's district format. Every city of the district is within 15 km of Tel Aviv.
    "tel aviv district": "tel aviv",
    "מחוז תל אביב": "tel aviv",
    "ramat-gan": "ramat gan",
    "רמת גן": "ramat gan",
    'ר"ג': "ramat gan",
    "giv'atayim": "givatayim",
    "גבעתיים": "givatayim",
    "bne brak": "bnei brak",
    "בני ברק": "bnei brak",
    "חולון": "holon",
    "בת ים": "bat yam",
    "petach tikva": "petah tikva",
    "petah tiqva": "petah tikva",
    "פתח תקווה": "petah tikva",
    "פתח תקוה": "petah tikva",
    'פ"ת': "petah tikva",
    "rosh ha'ayin": "rosh haayin",
    "ראש העין": "rosh haayin",
    "אור יהודה": "or yehuda",
    "herzliyya": "herzliya",
    "herzlia": "herzliya",
    "הרצליה": "herzliya",
    "ra'anana": "raanana",
    "רעננה": "raanana",
    "kfar-saba": "kfar saba",
    "כפר סבא": "kfar saba",
    "הוד השרון": "hod hasharon",
    "נתניה": "netanya",
    "rishon le zion": "rishon lezion",
    "rishon letsiyon": "rishon lezion",
    "ראשון לציון": "rishon lezion",
    'ראשל"צ': "rishon lezion",
    "nes ziona": "ness ziona",
    "נס ציונה": "ness ziona",
    "רחובות": "rehovot",
    "לוד": "lod",
    "modi'in": "modiin",
    "מודיעין": "modiin",
    "ירושלים": "jerusalem",
    "בית שמש": "beit shemesh",
    "חיפה": "haifa",
    "yoqneam": "yokneam",
    "yokneam illit": "yokneam",
    "יקנעם": "yokneam",
    "יוקנעם": "yokneam",
    "קיסריה": "caesarea",
    "כרמיאל": "karmiel",
    "נצרת": "nazareth",
    "be'er sheva": "beer sheva",
    "be'er-sheva": "beer sheva",
    "beersheba": "beer sheva",
    "באר שבע": "beer sheva",
    'ב"ש': "beer sheva",
    "אשדוד": "ashdod",
    "אשקלון": "ashkelon",
}

REMOTE_TERMS = ("remote", "work from home", "מרחוק", "מהבית")

SAME_CITY_SCORE = 100
# (maximum distance in km, score), checked in order. Anything further gets FAR_SCORE.
DISTANCE_BANDS: tuple[tuple[float, int], ...] = ((15, 85), (35, 60), (70, 40))
FAR_SCORE = 25
NEUTRAL_SCORE = 50

_EARTH_RADIUS_KM = 6371.0


def score_location(search_city: str | None, listing_location: str) -> int:
    """How close the listing is to the city chosen in the search (SPEC criterion 1).

    100 for the same city or remote, then lower with distance (see DISTANCE_BANDS), and a
    neutral 50 when the listing's city is unknown or no search city was chosen. When the
    listing names several known cities, the closest one counts.
    """
    if search_city is None:
        return NEUTRAL_SCORE
    reference = resolve_city(search_city)
    if reference is None:
        raise ValueError(f"unknown search city: {search_city!r}")

    text = normalize(listing_location)
    if any(term in text for term in REMOTE_TERMS):
        return SAME_CITY_SCORE

    cities = _cities_in(text)
    if not cities:
        if text:
            # Only the location string, which is public listing data. These logs are how
            # CITY_ALIASES grows from what the boards really send.
            logger.info("unrecognized listing location %r", listing_location)
        return NEUTRAL_SCORE
    return max(_score_between(reference, city) for city in cities)


def resolve_city(name: str) -> str | None:
    """Canonical name of a known city, or None. Accepts any spelling in CITY_ALIASES."""
    cities = _cities_in(normalize(name))
    return cities[0] if cities else None


def _cities_in(text: str) -> list[str]:
    """Every known city named in a location string, in order of appearance.

    The string is cut on commas, slashes, brackets and spaced dashes, so
    "Hybrid - Tel Aviv" and "Petah Tikva, Israel" give their city. A piece that isn't a
    city as a whole is tried again cut on plain dashes, for names like "תל אביב-יפו".
    """
    cities: list[str] = []
    for piece in re.split(r"[,/|()]|\s[-\u2013]\s", text):
        piece = piece.strip()
        city = _lookup(piece) or _lookup_dashed(piece)
        if city is not None and city not in cities:
            cities.append(city)
    return cities


def _lookup_dashed(piece: str) -> str | None:
    for part in piece.split("-"):
        city = _lookup(part.strip())
        if city is not None:
            return city
    return None


def _lookup(name: str) -> str | None:
    if name in CITY_COORDINATES:
        return name
    return CITY_ALIASES.get(name)


def _score_between(reference: str, city: str) -> int:
    if city == reference:
        return SAME_CITY_SCORE
    distance = _distance_km(CITY_COORDINATES[reference], CITY_COORDINATES[city])
    for max_km, score in DISTANCE_BANDS:
        if distance <= max_km:
            return score
    return FAR_SCORE


def _distance_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Great-circle (haversine) distance: straight line over the Earth's surface."""
    lat1, lon1, lat2, lon2 = map(math.radians, (*a, *b))
    h = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    )
    return 2 * _EARTH_RADIUS_KM * math.asin(math.sqrt(h))
