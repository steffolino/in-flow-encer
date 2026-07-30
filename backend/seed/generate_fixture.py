"""One-off generator for the synthetic social-content sample-data fixture.

Run with: `python -m seed.generate_fixture` from backend/. Writes
sample-data/social_content_fixture.json. Re-run only if you intentionally
want to regenerate the fixture (it uses a fixed random seed for
reproducibility, but the file is checked in so this does not need to run
in normal seeding).
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

from gazetteer import GAZETTEER

RNG = random.Random(42)

PLATFORMS = ["instagram", "tiktok", "facebook", "review_site"]
AUTHOR_CATEGORIES = ["tourist", "local_business", "influencer", "tourism_board"]

PERIOD_1 = (datetime(2026, 5, 1), datetime(2026, 5, 31, 23, 59))
PERIOD_2 = (datetime(2026, 6, 15), datetime(2026, 7, 15, 23, 59))

# post-count multipliers per place per period: (period1_base, period2_base)
TREND = {
    "Zugspitze": (6, 12),  # rising
    "Königssee": (5, 10),  # rising
    "Eibsee": (7, 8),  # roughly stable
    "Garmisch-Partenkirchen": (8, 9),  # roughly stable
    "Berchtesgaden": (6, 6),  # stable
    "Herzogstand": (4, 5),  # roughly stable
    "Tegernsee": (9, 4),  # declining
    "Walchensee": (7, 3),  # declining
}

CAPTION_TEMPLATES = [
    "Beautiful morning at {place}! #alps",
    "Hiking trip to {place} was unforgettable.",
    "Anyone else visiting {place} this weekend?",
    "{place} views never disappoint.",
    "Family day out near {place}.",
    "Sunset over {place} tonight.",
    "Grabbed lunch near {place}, highly recommend the area.",
    "Cable car ride up to {place} was worth it.",
]

random_id_counter = 0


def next_external_id() -> str:
    global random_id_counter
    random_id_counter += 1
    return f"fixture-{random_id_counter:04d}"


def random_timestamp(period: tuple[datetime, datetime]) -> datetime:
    start, end = period
    delta_seconds = int((end - start).total_seconds())
    return start + timedelta(seconds=RNG.randint(0, delta_seconds))


def perturb_coordinate(lon: float, lat: float, max_km: float = 1.5) -> tuple[float, float]:
    deg_per_km = 1 / 111.0
    d_lat = RNG.uniform(-max_km, max_km) * deg_per_km
    d_lon = RNG.uniform(-max_km, max_km) * deg_per_km
    return round(lon + d_lon, 6), round(lat + d_lat, 6)


def build_post(place: dict, published_at: datetime, variant: int) -> dict:
    author_category = RNG.choice(AUTHOR_CATEGORIES)
    platform = RNG.choice(PLATFORMS)
    author_name = f"synthetic_{author_category}_{RNG.randint(1, 60):03d}"
    caption = RNG.choice(CAPTION_TEMPLATES).format(place=place["name"])

    hashtags: list[str] = []
    location_text = None
    explicit_lat = None
    explicit_lon = None

    method_variant = variant % 5
    if method_variant == 0:
        lon, lat = perturb_coordinate(place["lon"], place["lat"])
        explicit_lon, explicit_lat = lon, lat
    elif method_variant == 1:
        location_text = place["name"]
    elif method_variant == 2:
        hashtags = [place["name"].lower().replace(" ", "").replace("ö", "oe").replace("ü", "ue")]
    elif method_variant == 3 and place["aliases"]:
        location_text = RNG.choice(place["aliases"])
    # method_variant == 4: caption-only exact name match (no extra field)

    return {
        "external_id": next_external_id(),
        "platform": platform,
        "author_name": author_name,
        "author_category": author_category,
        "published_at": published_at.isoformat(),
        "caption": caption,
        "hashtags": hashtags,
        "content_url": f"https://example-fixture.invalid/posts/{author_name}",
        "engagement_count": RNG.randint(5, 500),
        "estimated_reach": RNG.randint(100, 20000),
        "location_text": location_text,
        "explicit_lat": explicit_lat,
        "explicit_lon": explicit_lon,
        "raw_metadata": {"synthetic": True, "generator": "seed.generate_fixture"},
    }


def generate() -> list[dict]:
    posts: list[dict] = []
    for place in GAZETTEER:
        base1, base2 = TREND[place["name"]]
        for i in range(base1):
            posts.append(build_post(place, random_timestamp(PERIOD_1), i))
        for i in range(base2):
            posts.append(build_post(place, random_timestamp(PERIOD_2), i + 100))

    # Ambiguous / unresolved location examples: generic terms that match no
    # place name or alias in the gazetteer.
    for generic_text in ["Alm", "Berghütte", "Dorfplatz", "Aussichtspunkt", "Wanderweg"]:
        posts.append(
            {
                "external_id": next_external_id(),
                "platform": RNG.choice(PLATFORMS),
                "author_name": f"synthetic_tourist_{RNG.randint(1, 60):03d}",
                "author_category": "tourist",
                "published_at": random_timestamp(PERIOD_2).isoformat(),
                "caption": f"Nice spot at the {generic_text.lower()} today.",
                "hashtags": [],
                "content_url": None,
                "engagement_count": RNG.randint(5, 100),
                "estimated_reach": RNG.randint(100, 2000),
                "location_text": generic_text,
                "explicit_lat": None,
                "explicit_lon": None,
                "raw_metadata": {"synthetic": True, "note": "intentionally unresolved location"},
            }
        )

    # Duplicate records: repeat five already-generated posts with the same
    # external_id (content unchanged) to demonstrate idempotent import.
    duplicates = [posts[3], posts[10], posts[20], posts[35], posts[50]]
    posts.extend(dict(post) for post in duplicates)

    RNG.shuffle(posts)
    return posts


if __name__ == "__main__":
    records = generate()
    output_path = Path(__file__).resolve().parent.parent.parent / "sample-data" / "social_content_fixture.json"
    output_path.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(records)} records to {output_path}")
