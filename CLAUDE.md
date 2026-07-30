# CLAUDE.md

Guidance for working in this repository.

## What this is
Tourism attention & visitor-flow MVP for the Bavarian Alps. See
`README.md` for product scope and `docs/architecture.md` for the full
design. It's an analytics/geospatial platform — no AI SDK is a dependency,
and none should be added to the ingestion/matching/analytics critical path
(see `docs/adr/0006-ai-disabled-by-default.md`).

## Layout
- `backend/app/{domain,application,infrastructure,api}` — modular monolith;
  dependencies point inward. Route handlers never query the database
  directly — only `infrastructure/repositories/*` does.
- `frontend/src/{api,state,components,lib}` — API types/hooks in `api/`,
  filter/layer/tenant state in `state/`, no business logic in components.
- `sample-data/` — synthetic fixtures consumed by `backend/seed/run_seed.py`.
- `docs/adr/` — one ADR per significant architectural decision; add a new
  one rather than silently changing an existing decision.

## Commands
```bash
docker compose up --build
docker compose exec backend alembic upgrade head
docker compose exec backend python -m seed.run_seed
docker compose exec backend pytest
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run test
docker compose exec frontend npm run test:e2e
```

## Production deployment
Live at https://inflowencer.stefanstretz.de — Cloudflare Pages (frontend) +
Render (backend, `in-flow-encer-backend.onrender.com`) + Supabase Postgres.
See `docs/adr/0007-production-deployment-topology.md`. To redeploy the
frontend after a change:
```bash
cd frontend
VITE_API_BASE_URL="https://in-flow-encer-backend.onrender.com/api/v1" npm run build
npx wrangler pages deploy dist --project-name in-flow-encer --branch main
```
The backend redeploys automatically on push to `main` (Render is connected
to the GitHub repo). To re-seed or run a one-off script against the
production Supabase database, point `APP_DATABASE_URL` at its session
pooler connection string (see ADR 0007 for why it must be the session
pooler, not the direct host or transaction pooler).

## Conventions
- Backend: full type hints, domain-specific exceptions
  (`app/domain/shared/exceptions.py`) mapped centrally in `api/errors.py`,
  no untyped dicts in domain/application APIs — use a Pydantic model or
  dataclass.
- Frontend: no `any`, no server state duplicated into local React state
  (TanStack Query is the source of truth), stable query keys
  (`api/queryKeys.ts`).
- Tenant identity always comes from the resolved `Tenant` returned by
  `api/deps.get_current_tenant` (backend) / the `X-Tenant-Slug` header
  (frontend) — never trust a client-supplied `tenant_id` in a request body.
- Backend tests run against a self-provisioned `<db>_test` database (see
  `backend/tests/conftest.py`) — never point them at the seeded dev
  database.
