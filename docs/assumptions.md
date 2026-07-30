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
- **Three tenants are seeded** (`garmisch-partenkirchen`, `berchtesgaden`,
  `tegernsee-oberland`), each scoped to its own gazetteer region (matching
  each place's `region` field, not just rough map proximity) with zero
  place overlap between tenants, both in social content and in overlay
  data. An earlier version of the seed gave Garmisch tenant the *entire*
  fixture (including Berchtesgaden/Königssee posts); this was corrected
  because, from the UI, one tenant covering "everything" is
  indistinguishable from a cross-tenant data leak even when isolation is
  correctly enforced at the API/DB layer — see `seed/run_seed.py` and ADR
  0005's isolation tests, which confirm the isolation itself was never the
  bug.
- **Development tenant resolution** uses a trusted `X-Tenant-Slug` header,
  not a full auth flow, per the directive's explicit exclusion of
  production OIDC. See ADR 0005 for the replacement strategy.
- **Platform/author-category values are free-text strings**, not a fixed
  enum, since real integrations may introduce new values; the frontend's
  filter dropdowns use a fixed reference set for the MVP (see known
  limitations in the README) since there's no "distinct values" endpoint.
  The region filter's option list is intentionally kept in sync with the
  gazetteer's actual `region` values (`Werdenfelser Land`,
  `Berchtesgadener Land`, `Oberland`) rather than place or tenant names,
  since it's sent straight through as an API query parameter.
- **The frontend keeps its own `X-Tenant-Slug` header state in a
  module-level variable** (`api/client.ts`), synced from React's tenant
  context. That sync must be synchronous (done directly inside
  `TenantProvider`'s state setter and initial-render lazy initializer, not
  a `useEffect`) — a `useEffect`-based sync runs after children have
  already re-rendered and could fire a fetch for the newly-selected
  tenant's query key while still carrying the *previous* tenant's header,
  silently caching the wrong tenant's response under the new tenant's key.
  This was a real bug found and fixed, not just a theoretical risk.
- **The attention heatmap is a secondary "glow" layer, not the primary
  signal.** MapLibre's kernel-density `heatmap` layer type is built for
  dense point clouds; with only a handful of gazetteer places it renders as
  a faint, illegible blob. The primary, readable layer is a labeled circle
  marker per place, sized and colored by `attention_score`
  (`useAttentionMarkersSync.ts`), which is also what map↔table click
  interaction targets.
