# Extension guide

## Add a social-content source adapter

1. Write a function/class that reads your source's payload and produces a
   list of `CanonicalSocialContentInput`
   (`backend/app/application/ingestion/dto.py`) instances — this is the
   adapter step in `Source-specific payload → adapter → validation →
   canonical model → domain service → persistence` (ADR 0002).
2. Create (or reuse) a `Source` row with an appropriate `source_type`
   (add a new enum value to `SourceType` in
   `backend/app/domain/sources/models.py` if it's a genuinely new kind of
   source).
3. Call `SocialContentImporter(db).import_rows(tenant_id, source_id, rows)`
   — matching, deduplication, and persistence are already handled.
4. Expose it through a new route in `backend/app/api/v1/social_content.py`
   (or a new `sources`-oriented route) if it needs its own trigger endpoint.

No changes are needed to `LocationMatcher`, `AttentionAggregator`, or any
existing route — they only ever see canonical, persisted data.

## Add an external overlay connector

Implement `ExternalSourceConnector`
(`backend/app/application/overlays/connectors.py`):

```python
class MyConnector:
    async def validate_configuration(self, configuration: dict[str, object]) -> ValidationResult: ...
    async def fetch(self, configuration: dict[str, object], cursor: str | None = None) -> FetchResult:
        # return FetchResult(records=[...], next_cursor=...)
```

`FetchResult.records` should already be canonical dicts compatible with
`OverlayImportService`'s persistence step (geometry, observed_at, value,
external_id, properties) — reuse `parsing.ParsedFeature` as the target
shape. See `FixtureConnector` for the reference (local-JSON) implementation.
This Protocol is intentionally generic and does not attempt arbitrary
schema mapping — a genuinely new source with a different payload shape
needs its own small adapter function, not a configuration-driven mapper.

## Add a new deterministic matcher

Add a method to `LocationMatcher`
(`backend/app/application/ingestion/matching.py`) following the existing
pattern: given normalised input, return a `list[MatchCandidate]`, using a
new or existing `LocationMatchMethod` value and a documented confidence in
`MATCH_CONFIDENCE`. Call it from `LocationMatcher.match()` alongside the
existing methods — the confidence-ranking/dedup-by-place logic already
combines candidates from every method. If a method can plausibly find
several equally-good places, return no candidate for that method rather
than guessing (see the "ambiguous" handling in the existing methods).

## Add a new aggregation metric

Add the metric to `AttentionCell`
(`backend/app/application/analytics/attention.py`), compute it inside
`AttentionAggregator.compute()`, and add it to `AttentionCellOut`
(`backend/app/api/schemas.py`) plus the frontend's `AttentionCell` Zod
schema (`frontend/src/api/schemas.ts`) so it round-trips end to end. If it
needs its own weight, document it alongside `ATTENTION_WEIGHTS` the way
`post_count`/`reach`/`engagement` are documented.

## Add a new map-layer renderer

Frontend layers live under `frontend/src/components/map/`. Each layer type
(heatmap, points, overlay-by-geometry-type) is a small hook that
imperatively adds/updates a MapLibre source+layer pair, driven by the
typed layer-visibility/opacity state (`frontend/src/state/`) rather than by
component re-renders. To add a new layer type: write a
`useXyzLayer(map, data, options)` hook following the existing ones, add its
legend entry, and wire its visibility/opacity into the shared layer-control
list so it gets the same accessible controls as existing layers for free.
