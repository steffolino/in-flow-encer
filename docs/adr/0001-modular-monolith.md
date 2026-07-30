# ADR 0001: Modular monolith over microservices

## Status
Accepted

## Context
The MVP needs domain separation (tenancy, sources, ingestion, social content,
locations, overlays, analytics) without the operational overhead of running
and deploying multiple services for a first vertical slice.

## Decision
Build a single FastAPI application (`backend/app`) organised into
`domain/`, `application/`, `infrastructure/`, and `api/` layers, with
domain-oriented subpackages (`tenancy`, `sources`, `locations`,
`social_content`, `overlays`) inside `domain/` and `application/`.
Dependencies point inward: `api` depends on `application`, `application`
depends on `domain` and `infrastructure` repository interfaces,
`infrastructure` implements persistence for `domain` models.

## Consequences
- One deployable backend service, one database, one Docker image — simple
  local startup and a single migration history.
- Module boundaries are enforced by convention and code review, not by
  network/process isolation. If a module later needs independent scaling or
  a different technology, it can be extracted because the boundary already
  exists in code.
- We deliberately did not add a message bus, service mesh, or per-module
  database — unnecessary ceremony for this MVP's scope.
