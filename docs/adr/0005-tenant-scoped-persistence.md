# ADR 0005: Tenant-scoped persistence with a trusted dev header

## Status
Accepted

## Context
Multiple tourism regions/organisations must never see each other's data.
Production OIDC is explicitly out of scope for this MVP, but tenant
isolation itself is not optional.

## Decision
- Every tenant-owned table (`sources`, `social_content_items`,
  `location_matches` indirectly via content, `overlay_layers`,
  `overlay_features`) carries a `tenant_id` foreign key.
- The API resolves the active tenant from a trusted `X-Tenant-Slug` request
  header (`app/api/deps.py::get_current_tenant`) rather than from the
  request body — request/response schemas never accept a client-supplied
  `tenant_id`, so a client cannot claim another tenant's identity.
- Every repository method that reads or writes tenant-owned rows takes a
  resolved `tenant_id` and filters/checks against it; cross-tenant lookups
  raise `NotFoundError` (mapped to HTTP 404) rather than leaking existence.

## Consequences
- Tests (`tests/test_tenant_isolation.py`) assert directly that tenant A's
  content is invisible to tenant B, and that patch/delete/get on another
  tenant's overlay returns 404.
- Swapping the dev header for real OIDC later only changes
  `get_current_tenant`'s implementation (it already returns a resolved
  `Tenant` domain object) — no downstream service or repository code
  changes, since none of them trust client input for tenant identity.
