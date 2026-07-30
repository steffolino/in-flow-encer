"""Deterministic, explainable location matching.

No AI or fuzzy matching is used. Each method has a fixed, documented confidence
weight (see MATCH_CONFIDENCE). When a method's candidates are ambiguous (more
than one equally-good place), the method is skipped rather than guessing, so
matches never imply certainty they don't have. See docs/architecture.md
("Deterministic location matching") for the full rationale.
"""

import math
from dataclasses import dataclass

from app.domain.locations.models import Place
from app.domain.social_content.models import LocationMatchMethod
from app.infrastructure.repositories.places import PlaceRepository

from .text_normalisation import contains_word, extract_hashtags, normalise_text

MATCH_CONFIDENCE: dict[LocationMatchMethod, float] = {
    LocationMatchMethod.EXPLICIT_COORDINATES: 0.95,
    LocationMatchMethod.LOCATION_FIELD: 0.85,
    LocationMatchMethod.EXACT_PLACE_NAME: 0.75,
    LocationMatchMethod.ALIAS: 0.65,
    LocationMatchMethod.HASHTAG: 0.60,
    LocationMatchMethod.MANUAL: 1.0,
}

EXPLICIT_COORDINATE_RADIUS_KM = 5.0
_EARTH_RADIUS_KM = 6371.0


@dataclass(frozen=True)
class MatchCandidate:
    place_id: object
    method: LocationMatchMethod
    confidence: float
    matched_text: str | None


def haversine_km(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * _EARTH_RADIUS_KM * math.asin(math.sqrt(a))


class LocationMatcher:
    """Runs the deterministic matching pipeline against the shared gazetteer."""

    def __init__(self, place_repository: PlaceRepository) -> None:
        self._places = place_repository

    def match(
        self,
        *,
        explicit_lon: float | None,
        explicit_lat: float | None,
        location_text: str | None,
        caption: str | None,
        hashtags: list[str],
    ) -> list[MatchCandidate]:
        candidates: dict[object, MatchCandidate] = {}

        for method_result in (
            self._match_explicit_coordinates(explicit_lon, explicit_lat),
            self._match_location_field(location_text),
            self._match_exact_place_name(caption),
            self._match_alias(caption, location_text),
            self._match_hashtags(hashtags),
        ):
            for candidate in method_result:
                existing = candidates.get(candidate.place_id)
                if existing is None or candidate.confidence > existing.confidence:
                    candidates[candidate.place_id] = candidate

        return list(candidates.values())

    def _match_explicit_coordinates(
        self, lon: float | None, lat: float | None
    ) -> list[MatchCandidate]:
        if lon is None or lat is None:
            return []
        places = self._places.list_all()
        distances: list[tuple[float, Place]] = []
        for place in places:
            place_lon, place_lat = self._places.centroid_lon_lat(place)
            distances.append((haversine_km(lon, lat, place_lon, place_lat), place))
        distances.sort(key=lambda item: item[0])
        if not distances or distances[0][0] > EXPLICIT_COORDINATE_RADIUS_KM:
            return []
        if len(distances) > 1 and (distances[1][0] - distances[0][0]) < 0.05:
            return []  # ambiguous: two places equidistant to the tie threshold
        nearest_distance, nearest_place = distances[0]
        return [
            MatchCandidate(
                place_id=nearest_place.id,
                method=LocationMatchMethod.EXPLICIT_COORDINATES,
                confidence=MATCH_CONFIDENCE[LocationMatchMethod.EXPLICIT_COORDINATES],
                matched_text=f"{lat:.5f},{lon:.5f} (~{nearest_distance:.2f}km)",
            )
        ]

    def _match_location_field(self, location_text: str | None) -> list[MatchCandidate]:
        if not location_text:
            return []
        normalised = normalise_text(location_text)
        matches = self._places.find_by_exact_name(normalised) or self._places.find_by_alias(normalised)
        if len(matches) != 1:
            return []
        return [
            MatchCandidate(
                place_id=matches[0].id,
                method=LocationMatchMethod.LOCATION_FIELD,
                confidence=MATCH_CONFIDENCE[LocationMatchMethod.LOCATION_FIELD],
                matched_text=location_text,
            )
        ]

    def _match_exact_place_name(self, caption: str | None) -> list[MatchCandidate]:
        if not caption:
            return []
        normalised_caption = normalise_text(caption)
        found: list[MatchCandidate] = []
        for place in self._places.list_all():
            normalised_name = normalise_text(place.name)
            if contains_word(normalised_caption, normalised_name):
                found.append(
                    MatchCandidate(
                        place_id=place.id,
                        method=LocationMatchMethod.EXACT_PLACE_NAME,
                        confidence=MATCH_CONFIDENCE[LocationMatchMethod.EXACT_PLACE_NAME],
                        matched_text=place.name,
                    )
                )
        return found

    def _match_alias(self, caption: str | None, location_text: str | None) -> list[MatchCandidate]:
        haystacks = [normalise_text(t) for t in (caption, location_text) if t]
        if not haystacks:
            return []
        found: list[MatchCandidate] = []
        for place in self._places.list_all():
            for alias in place.aliases:
                normalised_alias = normalise_text(alias)
                if any(contains_word(text, normalised_alias) for text in haystacks):
                    found.append(
                        MatchCandidate(
                            place_id=place.id,
                            method=LocationMatchMethod.ALIAS,
                            confidence=MATCH_CONFIDENCE[LocationMatchMethod.ALIAS],
                            matched_text=alias,
                        )
                    )
                    break
        return found

    def _match_hashtags(self, hashtags: list[str]) -> list[MatchCandidate]:
        if not hashtags:
            return []
        normalised_tags = {normalise_text(tag) for tag in hashtags}
        found: list[MatchCandidate] = []
        for place in self._places.list_all():
            candidate_texts = {normalise_text(place.name)} | {normalise_text(a) for a in place.aliases}
            overlap = candidate_texts & normalised_tags
            if overlap:
                found.append(
                    MatchCandidate(
                        place_id=place.id,
                        method=LocationMatchMethod.HASHTAG,
                        confidence=MATCH_CONFIDENCE[LocationMatchMethod.HASHTAG],
                        matched_text="#" + next(iter(overlap)),
                    )
                )
        return found


__all__ = ["LocationMatcher", "MatchCandidate", "MATCH_CONFIDENCE", "extract_hashtags"]
