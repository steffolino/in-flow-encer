import re
import unicodedata

_HASHTAG_PATTERN = re.compile(r"#(\w+)", re.UNICODE)
_WORD_CHAR = re.compile(r"\w", re.UNICODE)


def normalise_text(value: str) -> str:
    """Unicode-safe, case-insensitive normalisation for name/alias comparisons."""
    decomposed = unicodedata.normalize("NFKD", value)
    without_marks = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return without_marks.strip().casefold()


def extract_hashtags(text: str | None) -> list[str]:
    if not text:
        return []
    return [normalise_text(tag) for tag in _HASHTAG_PATTERN.findall(text)]


def contains_word(haystack: str, needle_normalised: str) -> bool:
    """Word-boundary-aware substring search on already-normalised haystack text."""
    if not needle_normalised:
        return False
    pattern = r"(?<!\w)" + re.escape(needle_normalised) + r"(?!\w)"
    return re.search(pattern, haystack, re.UNICODE) is not None
