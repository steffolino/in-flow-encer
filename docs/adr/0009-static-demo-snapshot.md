# ADR 0009: Serve the public demo from JSON on Cloudflare Pages

## Status
Accepted; supersedes ADR 0007 for the public demo.

## Decision
Production builds enable `VITE_STATIC_DEMO=true`. The frontend loads
`frontend/public/demo/snapshot.json` from the same Cloudflare Pages deployment.
There is no running API or database dependency in the deployed demo.
The initial snapshot was exported from the existing local demo database
(3 tenants, 114 posts), because Render did not respond during migration.
It is not a backup of the inaccessible production database.

The existing query hooks and response schemas stay in place. A snapshot adapter
filters posts and calculates attention, forecasts, and comparisons in the
browser. Backend-generated answers cover multiple tenants, date windows,
platform and region filters, and empty results in parity tests.
Overlay comparison totals are computed with the backend's Shapely centroids
at export time. Map visibility and opacity remain local display controls.

The public snapshot includes all demo tenants; tenant selection is a UI filter,
not access control for this downloadable dataset. Only export data intended
for public demonstration. No credentials or database connection strings belong
in the snapshot.

Imports, uploads, and persistent edits are unavailable in snapshot mode, and
the import panel explains this. Development retains the full FastAPI backend.

## Refresh the snapshot

With the local Compose backend and database running, from the repository root:

```sh
docker compose exec backend python -m seed.export_demo --output /tmp/demo-snapshot.json --checks /tmp/demo-expected.json
docker compose cp backend:/tmp/demo-snapshot.json frontend/public/demo/snapshot.json
docker compose cp backend:/tmp/demo-expected.json frontend/src/api/demo.expected.json
npm run test --prefix frontend
npm run build --prefix frontend
npx wrangler pages deploy frontend/dist --project-name in-flow-encer --branch main
```

The exporter reads existing rows without migrations, seeding, or writes.
Check the database target before exporting. No database needs to run after
the export. Snapshot refresh is explicit, never part of the production build.

For a deployment with a real backend, override `VITE_STATIC_DEMO=false` and
set `VITE_API_BASE_URL` before building. The old Render Blueprint is retained
as historical configuration, but is not used by the demo.
