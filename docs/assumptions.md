# Assumptions and simplifications

Where the directive left a detail unspecified, this is what was chosen and
why. Nothing here blocks the acceptance criteria; all are documented
simplifications appropriate to an MVP.

- **Domain entities are SQLAlchemy models directly** (`domain/*/models.py`),
  not a separate hand-written domain object plus a parallel ORM mapping.
  See ADR 0001 / architecture.md "Domain model representation". The
  `infrastructure/repositories/` layer still owns all querying.
- **Distance calculations use Haversine in Python**, not PostGIS
  `ST_DWithin`, because the gazetteer is ~8 places for this MVP. GIST
  indexes are already in place for when this should move server-side (ADR
  0003).
- **Attention score weights and thresholds are fixed constants**
  (`ATTENTION_WEIGHTS` in `attention.py`, mean-split classification in
  `comparison.py`), not configurable per tenant. They're documented in code
  and returned in the API response (`weights`, `thresholds`) so the
  computation is auditable even though it isn't user-tunable yet.
- **Ambiguous location matches are simply left unresolved** (no match
  created) rather than stored with a special "ambiguous" flag — this keeps
  the `LocationMatch` schema uniform; a post with no matches is visibly
  distinguishable via `location_matches: []` in the API.
- **Region filtering** joins through `LocationMatch` → `Place.region`; a
  social-content item with no location match is excluded from any
  region-filtered result, since it can't be attributed to a region.
- **Overlay layer identity for re-import** is `(tenant_id, name)`: uploading
  a file with the same layer name updates the existing layer's features
  (with feature-level dedup) instead of creating a duplicate layer. This
  matches how the seed script re-runs idempotently.
- **Two tenants are seeded** (`garmisch-partenkirchen`,
  `berchtesgaden`), each with an overlapping-but-distinct slice of the
  synthetic fixture and their own overlays, specifically to make tenant
  isolation demonstrable out of the box.
- **Development tenant resolution** uses a trusted `X-Tenant-Slug` header,
  not a full auth flow, per the directive's explicit exclusion of
  production OIDC. See ADR 0005 for the replacement strategy.
- **Platform/author-category values are free-text strings**, not a fixed
  enum, since real integrations may introduce new values; the frontend's
  filter dropdowns use a fixed reference set for the MVP (see known
  limitations in the README) since there's no "distinct values" endpoint.
