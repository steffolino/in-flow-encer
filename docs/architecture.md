# Architecture

## Context

This is a modular-monolith backend (FastAPI + SQLAlchemy + PostGIS) with a
React/TypeScript frontend (MapLibre + TanStack Query), demonstrating one
vertical slice: import synthetic social-content data, match it deterministically
against a Bavarian Alps gazetteer, aggregate it into an attention heatmap,
and compare it against customer-uploaded visitor-flow overlays — all scoped
per tenant.

```
Social-content dataset (fixture/API)
  -> deterministic place matching (app/application/ingestion)
  -> PostGIS storage (app/domain/*, app/infrastructure/repositories)
  -> geographic aggregation (app/application/analytics)
  -> attention heatmap (frontend MapLibre layer)
  -> customer CSV/GeoJSON upload (app/application/overlays)
  -> separate visitor-flow overlay (frontend overlay layers)
  -> shared filters and comparison (analytics/comparison endpoint + frontend filter state)
```

## Module boundaries

Backend (`backend/app/`):

```
domain/          tenancy, sources, locations, social_content, overlays, shared
                 -- SQLAlchemy ORM models ARE the domain entities here (see
                 "Domain model representation" below); domain/shared holds
                 exceptions used across modules.
application/     ingestion (matching, canonical DTOs, importer),
                 analytics (attention aggregation, comparison),
                 overlays (CSV/GeoJSON parsing, import service, connector Protocol)
infrastructure/  repositories/ -- the only code that issues SQLAlchemy queries
api/             deps (tenant resolution), errors (exception -> HTTP mapping),
                 schemas (Pydantic request/response models), v1/ (routers)
```

Dependencies point inward: `api` → `application` → `domain` +
`infrastructure` (repositories) → `domain`. Route handlers never construct
a SQLAlchemy query directly; they call a repository or application service.

### Domain model representation

Rather than maintaining a separate "pure" domain object plus a parallel ORM
mapping (a common pattern in strict DDD), this MVP's domain entities *are*
the SQLAlchemy models under `domain/*/models.py`. For a modular monolith at
this scale, a second parallel representation would be a pass-through
abstraction with no behavioural difference — see ADR 0001. The
`infrastructure/repositories/` layer still owns all querying, so route
handlers and application services never touch SQLAlchemy sessions directly
(the requirement this separation exists to satisfy).

## Request flow (read)

```
HTTP request → FastAPI route (api/v1/*.py)
  → api/deps.get_current_tenant (resolves X-Tenant-Slug → Tenant)
  → application service or repository, scoped by tenant.id
  → Pydantic response schema (api/schemas.py)
```

## Import flow (write)

```
POST /social-content/import or /overlays/import/{csv,geojson}
  → resolve tenant (header) and get-or-create Source
  → validate payload (Pydantic canonical model / CSV+GeoJSON parser)
     invalid rows are recorded with row-level messages, not silently dropped
  → dedupe by (tenant, source/layer, content_hash) or external_id
  → persist valid rows; run LocationMatcher for social content
  → commit once per request; ImportReport returned
    (received/created/updated/skipped/invalid/duplicates/warnings)
```

If parsing fails at the file level (e.g. missing required CSV columns, a
non-FeatureCollection GeoJSON document), a `ValidationFailedError` is raised
**before** any Source/Layer is created, so a rejected upload never leaves a
half-created layer behind (see `tests/test_import_rollback.py`).

## Tenant isolation

Every tenant-owned table has a `tenant_id` column. The active tenant is
resolved once, from a trusted `X-Tenant-Slug` header, by
`api/deps.get_current_tenant` — never from the request body. Every
repository method that touches tenant-owned rows takes the resolved
`tenant_id` and either filters by it (lists) or checks it and raises
`NotFoundError` (single-resource get/patch/delete), which the global
exception handler turns into HTTP 404. See ADR 0005 and
`tests/test_tenant_isolation.py`.

## Geospatial architecture

PostgreSQL + PostGIS (via `geoalchemy2`), SRID 4326 throughout. See ADR
0003. Place and overlay-feature geometry columns get a GIST index
automatically. Distance-based logic (nearest-place matching for explicit
coordinates, visitor-flow-vs-place proximity in the comparison endpoint)
currently computes Haversine distance in Python over the small gazetteer;
this is documented as a scaling note in ADR 0003 rather than hidden.

## Deterministic location matching

`app/application/ingestion/matching.py` implements a fixed-order,
fixed-confidence pipeline (no fuzzy matching, no ML):

1. Explicit coordinates (nearest gazetteer place within 5 km; ties are left
   unresolved rather than guessed)
2. Structured `location_text` field (exact name or alias, case/Unicode
   normalised)
3. Exact place name found in the caption (word-boundary aware)
4. Alias found in the caption or location field
5. Hashtag matching a place name or alias

Each method has a fixed confidence weight (documented in `MATCH_CONFIDENCE`).
When multiple places tie for a method, that method contributes no match
rather than guessing — ambiguous mentions surface as `location_matches: []`,
not a false-confidence guess. Every match records its `method`,
`confidence`, and `matched_text` and is returned through the API, so no
inferred location is ever presented as certain.

## Attention aggregation

`app/application/analytics/attention.py` computes, per place, within the
requested filters: post count, total reach, total engagement, unique
creators, average match confidence, and change vs. the equivalent-length
previous period. `attention_score` is a weighted sum of min-max-normalised
post count / reach / engagement (weights documented in `ATTENTION_WEIGHTS`)
— a transparent, per-query-relative score, not a claim about real visitor
numbers.

## Comparison

`app/application/analytics/comparison.py` classifies each place's attention
as high/low against the mean attention score in the current result set, and
visitor-flow as high/low/unknown against overlay-feature values found
within 3 km of the place (unknown when no overlay data is nearby), then
emits one of a small fixed set of plain-language statements. No ML, no
hidden thresholds — `thresholds` are returned in the API response.

## Future connector strategy

`ExternalSourceConnector` (`app/application/overlays/connectors.py`) is a
`Protocol` any future pull-based source (a municipal API, a sensor feed)
implements: `validate_configuration` and `fetch`. Only `FixtureConnector`
(reads a local JSON file) is implemented; see `docs/extension-guide.md` for
adding a real one. Push-based imports (CSV/GeoJSON upload, the fixture
social-content importer) already follow the same
adapter → canonical-model → domain-service boundary (ADR 0002) without
needing this Protocol.

## Future authentication strategy

The dev tenant mechanism (`X-Tenant-Slug` header, see ADR 0005) is a single,
isolated dependency (`get_current_tenant`). Replacing it with real OIDC
means: validate a bearer token, map its claims to a `Tenant` (or a set of
tenants the user may access, with a tenant selector in the UI), and return
the same `Tenant` domain object `get_current_tenant` returns today. No
application service, repository, or route handler needs to change, because
none of them accept tenant identity from anywhere except this one
dependency's return value.

## AI-optional policy

See ADR 0006. No AI SDK is a dependency; nothing in the critical path
(ingestion, matching, aggregation) calls out to an AI API. The MVP runs
fully without any AI credentials.
