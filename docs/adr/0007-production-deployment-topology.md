# ADR 0007: Production deployment topology (Cloudflare Pages + Render + Supabase)

## Status
Accepted

## Context
The Docker Compose setup (ADR-adjacent, see `docker-compose.yml`) is for
local development: one `db` container, one `backend` container, one
`frontend` container, all on one Docker network with no host-facing
constraints. A public demo deployment needs each of those pieces hosted
somewhere real, on free tiers, without changing the application's actual
architecture.

## Decision
- **Frontend** → **Cloudflare Pages**, as a static build of `frontend/`.
  Cloudflare Pages cannot proxy `/api` the way Vite's dev server does, so
  the API base URL is baked in at build time via `VITE_API_BASE_URL`
  (`frontend/src/api/client.ts`) instead of relying on a relative `/api/v1`
  path.
- **Backend** → **Render**, using the existing `backend/Dockerfile`
  unchanged, via `render.yaml` (a Render Blueprint). Render's free plan has
  no separate one-off "release" job step, so `backend/docker-entrypoint.sh`
  runs `alembic upgrade head` before starting `uvicorn`, and binds to
  `$PORT` (Render assigns this dynamically) instead of a fixed port.
- **Database** → **Supabase** Postgres with the `postgis` extension enabled
  manually (not via a Docker image with PostGIS baked in, since Supabase
  provisions its own Postgres). Connects over Supabase's **session pooler**
  (port 5432, not the transaction pooler on 6543) — direct connections to
  Supabase's `db.<ref>.supabase.co` host are IPv6-only, which most
  free-tier PaaS egress (including Render's) cannot reach; the pooler
  hostname resolves to IPv4 as well.
- CORS (`APP_CORS_ORIGINS`, comma-separated, see `app/config.py`) is set on
  the Render service to the Cloudflare Pages URL and the custom domain.

## Consequences
- No code is deployment-specific beyond the two env-driven knobs above
  (`VITE_API_BASE_URL`, `APP_CORS_ORIGINS`) — the same Docker images and
  Alembic migrations run in both Docker Compose and production.
- Every piece is free, at the cost of two well-known free-tier limitations:
  Render's web service spins down after ~15 min idle (cold start ~30s), and
  Supabase's free project pauses after a week of inactivity. Acceptable for
  a demo; would need paid tiers for an always-on production deployment.
- The custom domain (`inflowencer.stefanstretz.de`) is a CNAME to
  `in-flow-encer.pages.dev`, added via Cloudflare Pages' custom-domains API
  once DNS for that zone was confirmed to already be on Cloudflare.
