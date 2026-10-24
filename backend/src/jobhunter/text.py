"""Text normalization shared by everything that matches words in listings.

Matching only: quotes shown to the user and checked against the listing (SPEC criterion
5) always come from the raw text, never from a normalized copy.
"""

import re

_HEBREW_LETTER = r"[\u05d0-\u05ea]"
# "מפתח/ת", "בכיר/ה", "סטודנט/ית": boards write both genders with a slash suffix.
_GENDER_SUFFIX = re.compile(rf"(?<={_HEBREW_LETTER})/(?:ת|ה|ית|ות|יה)(?!{_HEBREW_LETTER})")
_NIQQUD = re.compile(r"[\u0591-\u05c7]")
# Invisible direction marks (LRM, RLM, embeddings, isolates): boards such as Drushim put
# them around numbers in Hebrew text, e.g. before "2-3" in "ניסיון של 2-3 שנים".
_BIDI_MARKS = re.compile(r"[\u200e\u200f\u202a-\u202e\u2066-\u2069]")


def normalize(text: str) -> str:
    """Lowercase, one kind of quote mark, no niqqud, direction marks or gender suffix,
    single spaces.

    Hebrew abbreviations use the gershayim (U+05F4) or a straight double quote, and names
    like Ra'anana use the geresh (U+05F3) or an apostrophe; job boards mix all of them,
    along with typographic quotes.
    """
    text = text.lower()
    text = re.sub(r"[\u05f4\u201c\u201d]", '"', text)
    text = re.sub(r"[\u05f3\u2018\u2019`]", "'", text)
    text = _NIQQUD.sub("", text)
    text = _BIDI_MARKS.sub("", text)
    text = _GENDER_SUFFIX.sub("", text)
    return " ".join(text.split())


def has_hebrew(text: str) -> bool:
    return re.search(_HEBREW_LETTER, text) is not None


def contains_term(text: str, term: str) -> bool:
    """Whether a normalized `text` contains a normalized `term`.

    Latin terms must be whole words, so "nurse" doesn't match "nursery" nor "sales"
    "wholesale". Hebrew terms match anywhere, because one-letter prefixes attach to the
    word: "והנהלת חשבונות" must match "הנהלת חשבונות".
    """
    if has_hebrew(term):
        return term in text
    return re.search(rf"(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])", text) is not None
