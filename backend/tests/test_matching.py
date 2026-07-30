from app.application.ingestion.matching import LocationMatcher
from app.domain.social_content.models import LocationMatchMethod
from app.infrastructure.repositories.places import PlaceRepository


def test_explicit_coordinates_match_nearest_place(db, bavarian_places):
    matcher = LocationMatcher(PlaceRepository(db))
    zugspitze = bavarian_places["Zugspitze"]
    lon, lat = PlaceRepository(db).centroid_lon_lat(zugspitze)

    candidates = matcher.match(
        explicit_lon=lon + 0.001,
        explicit_lat=lat + 0.001,
        location_text=None,
        caption=None,
        hashtags=[],
    )

    assert len(candidates) == 1
    assert candidates[0].place_id == zugspitze.id
    assert candidates[0].method == LocationMatchMethod.EXPLICIT_COORDINATES


def test_explicit_coordinates_far_from_any_place_yield_no_match(db, bavarian_places):
    matcher = LocationMatcher(PlaceRepository(db))
    candidates = matcher.match(
        explicit_lon=8.0, explicit_lat=50.0, location_text=None, caption=None, hashtags=[]
    )
    assert candidates == []


def test_location_field_exact_match(db, bavarian_places):
    matcher = LocationMatcher(PlaceRepository(db))
    candidates = matcher.match(
        explicit_lon=None, explicit_lat=None, location_text="Eibsee", caption=None, hashtags=[]
    )
    assert len(candidates) == 1
    assert candidates[0].place_id == bavarian_places["Eibsee"].id
    assert candidates[0].method == LocationMatchMethod.LOCATION_FIELD


def test_location_field_is_case_and_unicode_insensitive(db, bavarian_places):
    matcher = LocationMatcher(PlaceRepository(db))
    candidates = matcher.match(
        explicit_lon=None, explicit_lat=None, location_text="EIBSEE", caption=None, hashtags=[]
    )
    assert len(candidates) == 1
    assert candidates[0].place_id == bavarian_places["Eibsee"].id


def test_exact_place_name_word_boundary(db, bavarian_places):
    matcher = LocationMatcher(PlaceRepository(db))
    candidates = matcher.match(
        explicit_lon=None,
        explicit_lat=None,
        location_text=None,
        caption="Amazing hike up the Zugspitze today!",
        hashtags=[],
    )
    place_ids = {c.place_id for c in candidates}
    assert bavarian_places["Zugspitze"].id in place_ids


def test_exact_place_name_does_not_match_substring_within_another_word(db, bavarian_places):
    matcher = LocationMatcher(PlaceRepository(db))
    # "Eibseee" should NOT match "Eibsee" due to word-boundary matching.
    candidates = matcher.match(
        explicit_lon=None, explicit_lat=None, location_text=None, caption="Visiting Eibseee resort", hashtags=[]
    )
    place_ids = {c.place_id for c in candidates}
    assert bavarian_places["Eibsee"].id not in place_ids


def test_alias_match(db, bavarian_places):
    matcher = LocationMatcher(PlaceRepository(db))
    candidates = matcher.match(
        explicit_lon=None, explicit_lat=None, location_text="tegern see", caption=None, hashtags=[]
    )
    assert len(candidates) == 1
    assert candidates[0].place_id == bavarian_places["Tegernsee"].id
    # A structured location_text field matching an alias is still tagged
    # LOCATION_FIELD (higher confidence than a freeform-caption alias match).
    assert candidates[0].method == LocationMatchMethod.LOCATION_FIELD

    caption_candidates = matcher.match(
        explicit_lon=None, explicit_lat=None, location_text=None, caption="Lovely day at tegern see", hashtags=[]
    )
    assert len(caption_candidates) == 1
    assert caption_candidates[0].place_id == bavarian_places["Tegernsee"].id
    assert caption_candidates[0].method == LocationMatchMethod.ALIAS


def test_hashtag_match(db, bavarian_places):
    matcher = LocationMatcher(PlaceRepository(db))
    candidates = matcher.match(
        explicit_lon=None, explicit_lat=None, location_text=None, caption=None, hashtags=["zugspitz"]
    )
    assert len(candidates) == 1
    assert candidates[0].place_id == bavarian_places["Zugspitze"].id
    assert candidates[0].method == LocationMatchMethod.HASHTAG


def test_ambiguous_location_field_remains_unresolved(db, bavarian_places):
    matcher = LocationMatcher(PlaceRepository(db))
    # A generic word that matches no gazetteer entry must not produce a
    # false-positive match; it should remain unresolved rather than guess.
    candidates = matcher.match(
        explicit_lon=None, explicit_lat=None, location_text="Berghütte", caption=None, hashtags=[]
    )
    assert candidates == []


def test_multiple_methods_prefer_highest_confidence_per_place(db, bavarian_places):
    matcher = LocationMatcher(PlaceRepository(db))
    zugspitze = bavarian_places["Zugspitze"]
    lon, lat = PlaceRepository(db).centroid_lon_lat(zugspitze)

    candidates = matcher.match(
        explicit_lon=lon,
        explicit_lat=lat,
        location_text=None,
        caption="Zugspitze",
        hashtags=["zugspitz"],
    )
    matches_for_place = [c for c in candidates if c.place_id == zugspitze.id]
    assert len(matches_for_place) == 1
    assert matches_for_place[0].method == LocationMatchMethod.EXPLICIT_COORDINATES
