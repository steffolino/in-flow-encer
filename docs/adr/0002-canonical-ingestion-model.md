# ADR 0002: Canonical ingestion model at the adapter boundary

## Status
Accepted

## Context
The platform must support today's fixture-based import and, in the future,
real source integrations (a municipal API, a sensor feed, a customer's own
export) without rewriting the matching, aggregation, or storage logic each
time. The directive explicitly excludes building scraping integrations now
but requires the seam to exist.

## Decision
Every social-content import passes through `CanonicalSocialContentInput`
(`backend/app/application/ingestion/dto.py`), a Pydantic model the
`SocialContentImporter` accepts regardless of where rows came from. Overlay
imports mirror this with `ParsedFeature`
(`backend/app/application/overlays/parsing.py`) and the
`ExternalSourceConnector` Protocol
(`backend/app/application/overlays/connectors.py`) for future pull-based
sources. A platform-specific adapter's only job is:

```
Source-specific payload -> adapter -> validation -> canonical model -> domain service -> persistence
```

## Consequences
- Adding a new source (e.g. a municipal REST API) means writing an adapter
  that produces `CanonicalSocialContentInput`/`ParsedFeature` records; no
  change to `LocationMatcher`, `AttentionAggregator`, or persistence code.
- The only concrete connector shipped is `FixtureConnector` (local JSON
  file), per the directive's exclusion of production social-platform
  integrations. See `docs/extension-guide.md` for adding a real one.
