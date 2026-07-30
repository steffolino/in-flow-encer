# ADR 0006: AI disabled by default, no AI in the critical path

## Status
Accepted

## Context
The product is an analytics/geospatial platform, not an AI product. Real
landmark recognition, predictive flow modeling, and live scraping are
explicitly excluded from the MVP; the directive still requires a
forward-compatible extension point.

## Decision
- No AI SDK is a dependency of this codebase.
- `LocationMatchMethod.CUSTOMER_AI` exists as an enum value in the domain
  model purely as a documented future-compatible value; nothing in the
  matching pipeline (`LocationMatcher`) produces it.
- All location matching and attention scoring is deterministic and
  explainable (documented weights/thresholds in `attention.py` and
  `comparison.py`), with method and confidence always stored and exposed
  through the API.
- Any future AI integration must, per this ADR: be disabled by default,
  use customer-supplied API credentials, require explicit user action, be
  excluded from automatic ingestion, cache its results, record the
  provider/model used, mark AI-derived values distinctly from deterministic
  ones, and always have a deterministic fallback.

## Consequences
- The MVP works fully offline from any third-party AI API — no API keys
  needed to run the complete vertical slice.
- Adding AI-assisted matching later is additive (a new matcher module
  producing `customer_ai`-tagged matches under the existing
  `LocationMatch` schema), not a rewrite.
