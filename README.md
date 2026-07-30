# Tourism Attention & Visitor-Flow MVP

A geospatial analytics MVP for tourism regions in the Bavarian Alps. It
compares **public social-media attention** around places against
**customer-supplied visitor-flow data** (CSV/GeoJSON uploads), on one map,
with shared filters — while keeping the two kinds of data visually and
semantically distinct. This is an analytics/geospatial platform, not an AI
product: no AI API is used or required anywhere in the critical path (see
`docs/adr/0006-ai-disabled-by-default.md`).

All social-content data shipped in this repo is **synthetic test data**,
clearly labeled as such in the UI. The gazetteer coordinates (Zugspitze,
Eibsee, Königssee, etc.) are approximate public geographic reference points.

## Live deployment

A running instance is deployed at **https://inflowencer.stefanstretz.de**
(also reachable at https://in-flow-encer.pages.dev):

- Frontend: Cloudflare Pages (static build of `frontend/`)
- Backend: Render free web service (`in-flow-encer-backend.onrender.com`),
  runs Alembic migrations automatically on boot
- Database: Supabase PostgreSQL + PostGIS

See `docs/adr/0007-production-deployment-topology.md` for how this maps onto
the local Docker Compose setup and what would change for a non-free-tier
deployment.

## What's implemented

- Multi-tenant backend (FastAPI + SQLAlchemy + Alembic + PostGIS)
- Deterministic (non-AI) location matching: explicit coordinates, structured
  location field, exact place name, alias, hashtag — each with a documented
  confidence weight; ambiguous mentions are left unresolved, never guessed
- Idempotent social-content import with row-level validation reporting
- Attention aggregation (post count, reach, engagement, unique creators,
  period-over-period change, a documented `attention_score`)
- Customer CSV and GeoJSON overlay upload, validated, idempotent, rendered
  as a separate map layer from social attention
- A documented `ExternalSourceConnector` Protocol for future pull-based
  sources (only a local-fixture connector is implemented)
- Attention-vs-visitor-flow comparison with transparent thresholds
- React + TypeScript + MapLibre frontend: a labeled, size/color-graduated
  marker per place (the primary, legible attention signal — a soft heatmap
  glow sits underneath it, not in place of it, since a diffuse kernel-density
  heatmap alone is illegible with only a handful of gazetteer places),
  optional individual-post point view, overlay layers, per-layer legend/
  opacity/visibility, filters (date/platform/region/source/author-category),
  an accessible non-map results table, a dashboard summary strip, and
  CSV/GeoJSON upload with import reports
- Map ↔ table interaction: clicking a marker opens a popup and highlights
  the matching results-table row; clicking a table row flies the map to and
  highlights that marker. Selection clears automatically on tenant switch.
- Tenant isolation enforced end-to-end and tested (backend + explicit tests),
  including a fixed race condition where the `X-Tenant-Slug` header could
  briefly lag a tenant switch (see `docs/assumptions.md`)

## Prerequisites

- Docker + Docker Compose
- (Optional, for running things outside Docker) Python 3.11+ and Node 20+

## Startup

```bash
cp .env.example .env
docker compose up --build
```

This starts three services: `db` (PostgreSQL + PostGIS, internal network
only), `backend` (FastAPI on `http://localhost:8010` by default — see
`BACKEND_PORT` in `.env`), and `frontend` (Vite dev server on
`http://localhost:5173`).

## Migrations

```bash
docker compose exec backend alembic upgrade head
```

(Use `docker compose run --rm backend alembic upgrade head` if the stack
isn't already running.)

## Seed sample data

```bash
docker compose exec backend python -m seed.run_seed
```

Idempotent — re-running does not create duplicate tenants, places, or
content. Seeds **three tenants**, each scoped to its own region (matching
the gazetteer's own `region` field, not just rough proximity — see
`docs/assumptions.md`):

| Tenant slug             | Region              | Places                                              |
|--------------------------|----------------------|------------------------------------------------------|
| `garmisch-partenkirchen` | Werdenfelser Land    | Zugspitze, Eibsee, Garmisch-Partenkirchen             |
| `berchtesgaden`          | Berchtesgadener Land | Berchtesgaden, Königssee                              |
| `tegernsee-oberland`     | Oberland             | Tegernsee, Walchensee, Herzogstand                    |

Each tenant gets only its own slice of the ~120-record synthetic
social-content fixture (with rising/declining locations, ambiguous location
examples, and intentional duplicates to demonstrate idempotency) and only
the overlay rows/features relevant to its own places — every tenant is
offered every overlay file (`sample-data/visitor_counter.csv`,
`sample-data/parking_occupancy.csv`, `sample-data/protected_areas.geojson`),
filtered by label per tenant, with the import skipped entirely where nothing
matches.

## Manually importing sample data yourself

Through the running frontend (`http://localhost:5173`): pick a tenant, use
the "Import social content" panel with `sample-data/social_content_fixture.json`,
then the "Upload visitor-flow overlay" panel with any of the CSV/GeoJSON
files in `sample-data/`. `sample-data/malformed_import_example.csv`
demonstrates row-level validation error reporting.

Via the API directly:

```bash
curl -X POST http://localhost:8010/api/v1/overlays/import/csv \
  -H "X-Tenant-Slug: garmisch-partenkirchen" \
  -F "file=@sample-data/visitor_counter.csv" \
  -F "name=visitor_counter" -F "measurement_type=visitor_count" -F "unit=people"
```

## Tests

```bash
docker compose exec backend pytest
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run test
docker compose exec frontend npm run test:e2e
```

(Backend tests create and migrate their own `<db>_test` database
automatically — they never run against the seeded development database.)

Locally (outside Docker), from `backend/` with a virtualenv and
`APP_DATABASE_URL` pointing at a reachable Postgres/PostGIS instance:
`pip install -r requirements.txt && pytest`. From `frontend/`:
`npm ci && npm run lint && npm run typecheck && npm run test && npm run test:e2e`.

## Known limitations

- Distance-based matching/comparison logic computes Haversine distance in
  Python rather than PostGIS spatial queries — fine at the current
  gazetteer size (~8 places), documented as a scale-up note in
  `docs/adr/0003-postgis.md`.
- Filter dropdowns (platform, author category) in the frontend use a fixed
  reference list rather than querying distinct values from the API, since
  no such endpoint exists yet.
- The Vite production bundle exceeds the default 500 kB warning threshold
  (MapLibre GL is large); not code-split in this MVP.
- No production authentication (by design — see
  `docs/adr/0005-tenant-scoped-persistence.md` for the replacement path),
  no billing, no role management, no production monitoring — all explicitly
  out of scope per the product directive.
- The Playwright e2e spec covers the single main flow described in the
  directive; it is not a full regression suite.
- The live deployment runs on free tiers: Render's free web service spins
  down after ~15 min idle (first request after idle takes ~30s to wake), and
  Supabase's free project pauses after a week of inactivity (data isn't
  lost, just needs un-pausing from the dashboard).

## Repository structure

```
frontend/         React + TypeScript + Vite + MapLibre
backend/          FastAPI + SQLAlchemy + Alembic, domain/application/infrastructure/api layers
docs/             architecture, data model, extension guide, assumptions, ADRs
sample-data/      synthetic fixtures and overlay files used by the seed command
docker-compose.yml
render.yaml        Render Blueprint for the production backend deploy
.env.example
```

See `docs/architecture.md`, `docs/data-model.md`, and
`docs/extension-guide.md` for the details behind each piece.
