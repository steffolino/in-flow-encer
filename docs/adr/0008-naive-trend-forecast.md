# ADR 0008: Naive trend-extrapolation forecast, no time-series model

## Status
Accepted

## Context
The product vision calls for a forecast layer ("where is attention heading
next") alongside the existing attention layer ("where is attention now").
Per ADR 0006, predictive flow modeling is explicitly excluded from this MVP
and any forecast must be deterministic and explainable, not ML-derived. The
only historical signal available is the attention aggregation already
computed by `AttentionAggregator` (`app/application/analytics/attention.py`),
which includes `change_vs_previous_period` — the percentage change in post
count between the previous and current equivalent-length period.

## Decision
`app/application/analytics/forecast.py`'s `ForecastService` projects the
*next* equivalent-length period per place using only that existing number:

    forecast_score = attention_score * (1 + change_vs_previous_period / 100)

If there is no previous period to compare against, the forecast repeats the
current score and is marked "low" confidence. Confidence is a fixed function
of `post_count` (>= 10 posts -> "high", >= 3 -> "medium", else "low") — a
statement about how much data the trend is based on, not a statistical
error estimate — and each band has a fixed +/- spread used to render
`forecast_score_low`/`forecast_score_high`. `drivers` echoes the same
`ATTENTION_WEIGHTS` used by the attention score, and every response also
lists `not_yet_connected` signal families (weather, events/ticketing,
mobile/location data) that are not part of this computation, so the API
never implies a broader input set than it actually has.

No time-series library, no learned parameters, no ML/AI SDK — consistent
with ADR 0006. Given the two numbers this formula uses, anyone can
reproduce the output by hand.

## Consequences
- The forecast is honest about being a projection of an existing trend
  metric, not a new model: it can only be as good as
  `change_vs_previous_period` already is, and inherits its limitations
  (needs two comparable periods; noisy with few posts).
- Upgrading to a real time-series/statistical model later is additive:
  `ForecastService.compute` keeps the same method signature and
  `ForecastResult`/`ForecastCell` shape, so `api/v1/analytics.py` and the
  frontend contract do not need to change — the same swap-without-rewrite
  pattern already used for `ExternalSourceConnector` (see
  `docs/architecture.md`, "Future connector strategy").
- `confidence` and `not_yet_connected` must stay in the response so the
  About/Methodology page can describe the forecast accurately without
  drifting from what the code actually does.
