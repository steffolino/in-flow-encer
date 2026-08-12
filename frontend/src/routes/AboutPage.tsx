import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Lightbox } from '../components/layout/Lightbox'

interface LightboxTarget {
  src: string
  alt: string
}

/**
 * A plain-language explanation of what this MVP is, how the forecast is
 * computed, what has and hasn't been validated, and the privacy/open-source
 * stance — written to stay accurate to the code, not aspirational. See
 * docs/architecture.md and docs/adr/0008-naive-trend-forecast.md for the
 * engineering-level versions of the same claims.
 */
export function AboutPage(): React.JSX.Element {
  const [lightbox, setLightbox] = useState<LightboxTarget | null>(null)

  return (
    <div className="app-shell">
      <Header />

      <main className="about-page">
        <section className="panel about-hero">
          <h2>What this is</h2>
          <p className="about-lead">
            Inflowencer is a geospatial analytics MVP for tourism regions in the Bavarian Alps.
            It compares <strong>public social-media attention</strong> around places against{' '}
            <strong>customer-supplied visitor-flow data</strong> (CSV/GeoJSON uploads) on one map,
            and projects a simple near-term forecast from the attention trend. It is an
            analytics/geospatial platform, not an AI product — no AI API is used or required
            anywhere in the critical path.
          </p>
          <p>
            All social-content data in this deployment is <strong>synthetic test data</strong> for
            one pilot region (the Bavarian Alps), scoped per tenant. Nothing shown here reflects
            real visitors.
          </p>
        </section>

        <section className="panel">
          <h2>Architecture</h2>
          <p>The system is one straight pipeline, kept deliberately simple end to end:</p>
          <p className="about-eyebrow">Pipeline</p>
          <pre className="about-diagram">
{`Social-content dataset (fixture/API)
  -> deterministic place matching
  -> PostGIS storage, scoped per tenant
  -> geographic aggregation -> attention score
  -> trend extrapolation -> forecast score
  -> map (attention layer, forecast layer, uploaded overlays)
  -> shared filters, comparison, and this page`}
          </pre>
          <p>
            Every stage is deterministic and auditable: location matching uses a fixed-order,
            fixed-confidence pipeline (never fuzzy, never guessed), and the attention/forecast
            scores are documented formulas over real counts, not learned parameters. A future
            pull-based data source (a municipal API, a sensor feed) plugs into an existing
            connector interface without changing anything upstream of it — the same is true for
            swapping the forecast method for a real statistical model later.
          </p>

          <figure className="about-figure">
            <div className="about-figure-scroll">
              <button
                type="button"
                className="about-figure-trigger"
                onClick={() => {
                  setLightbox({
                    src: '/img/architecture-and-forecast-methodology-overview.png',
                    alt: "Diagram showing the Inflowencer data pipeline from social content and customer uploads through deterministic place matching, tenant-scoped PostGIS storage, geographic aggregation into an attention score, and trend extrapolation into a forecast score, alongside a breakdown of the forecast formula, a worked example, confidence bands by data volume, and which signals are and aren't included in the forecast.",
                  })
                }}
                aria-label="Enlarge diagram"
              >
                <img
                  src="/img/architecture-and-forecast-methodology-overview.png"
                  alt="Diagram showing the Inflowencer data pipeline from social content and customer uploads through deterministic place matching, tenant-scoped PostGIS storage, geographic aggregation into an attention score, and trend extrapolation into a forecast score, alongside a breakdown of the forecast formula, a worked example, confidence bands by data volume, and which signals are and aren't included in the forecast."
                />
              </button>
            </div>
            <figcaption>
              The end-to-end pipeline (left) and the forecast formula it feeds (right) — click to
              enlarge. See "Forecast methodology" below and ADR 0008 for the full decision record.
            </figcaption>
            <p className="about-callout about-figure-correction">
              <strong>One correction to this diagram:</strong> the "Comparison Panel (Example)"
              mockup shows a detailed numeric score/diff table (exact attention scores, visitor
              counts, a percentage-point difference). The real comparison panel is simpler — it
              shows a plain-language high/low/unknown statement per place (e.g. "High social
              attention and high visitor-flow values"), not a numeric side-by-side table.
            </p>
          </figure>

          <figure className="about-figure">
            <div className="about-figure-scroll">
              <button
                type="button"
                className="about-figure-trigger"
                onClick={() => {
                  setLightbox({
                    src: '/img/architecture-technical-deep-dive.png',
                    alt: 'A more detailed technical diagram of the same pipeline, showing individual backend services (ingestion, matching, aggregation, forecast, export), the PostGIS data layer, cross-cutting concerns such as tenant isolation and determinism, and pluggable external integrations for future data sources.',
                  })
                }}
                aria-label="Enlarge diagram"
              >
                <img
                  src="/img/architecture-technical-deep-dive.png"
                  alt="A more detailed technical diagram of the same pipeline, showing individual backend services (ingestion, matching, aggregation, forecast, export), the PostGIS data layer, cross-cutting concerns such as tenant isolation and determinism, and pluggable external integrations for future data sources."
                />
              </button>
            </div>
            <figcaption>
              A closer, more technical look at the same architecture — click to enlarge.
            </figcaption>
            <p className="about-callout about-figure-correction">
              <strong>Corrections to this diagram:</strong> the "audit_log" table it references
              (in Core Tables and "Deterministic & auditable") doesn't exist — there's no
              persisted audit log. The "Export Service" / CSV/GeoJSON "reports &amp; snapshots"
              it shows also doesn't exist — the API only supports CSV/GeoJSON <em>import</em> for
              overlays, not export. And "Storage (S3 compatible) for uploads &amp; exports" isn't
              implemented either (uploads are processed in-memory) — unlike the other two
              integrations shown, it's missing a "(future)" label.
            </p>
          </figure>
        </section>

        <section className="panel">
          <h2>Forecast methodology</h2>
          <p>
            The forecast layer projects each place's <em>next</em> equivalent-length period using
            one number already computed for the attention view: the percentage change from the
            previous period to the current one.
          </p>
          <p className="about-eyebrow">Formula</p>
          <pre className="about-diagram">
{`forecast_score = attention_score * (1 + change_vs_previous_period / 100)`}
          </pre>
          <p>
            This is <strong>not machine learning</strong> — no model is trained, and there are no
            learned parameters. It is a documented, reproducible formula: given the two input
            numbers, anyone can recompute the output by hand. Confidence bands (
            <em>high / medium / low</em>) reflect how many posts the trend is based on, not a
            statistical error estimate — more data means the trend is better-supported, not that
            the projection is guaranteed. The forecast panel also lists exactly which signals fed
            into it (social post volume, reach, engagement) and which ones did not (weather,
            events/ticketing, mobile/location data) — see the Forecast panel on the map for the
            live numbers, and{' '}
            <a
              href="https://github.com/steffolino/in-flow-encer/blob/main/docs/adr/0008-naive-trend-forecast.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              ADR 0008
            </a>{' '}
            for the full decision record.
          </p>
        </section>

        <section className="panel">
          <h2>Validation</h2>
          <p className="about-callout">
            Honestly: this MVP has <strong>not been validated against real visitor counts</strong>,
            because none exist in this deployment — all data is synthetic. The "compare to visitor
            flow" panel checks the attention score against uploaded overlay data (e.g. parking or
            footfall counters) for internal consistency within the same dataset; it is not
            ground-truth validation against actual tourism numbers. Validating the forecast
            approach against real historical visitor data is the natural next step before treating
            it as more than a demo.
          </p>
        </section>

        <section className="panel">
          <h2>Privacy</h2>
          <ul>
            <li>All places, social content, and visitor-flow overlays shown here are synthetic.</li>
            <li>
              Every tenant-owned record is scoped by a server-resolved tenant identity; a request
              can never read or write another tenant's data by supplying a different id.
            </li>
            <li>
              No AI API credentials are required to run this deployment, and nothing in the
              ingestion, matching, or forecasting path calls out to a third-party AI service.
            </li>
          </ul>
        </section>

        <section className="panel">
          <h2>Open source</h2>
          <p>
            The full source is available on{' '}
            <a
              href="https://github.com/steffolino/in-flow-encer"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            , including the architecture docs and every ADR referenced on this page. There is
            currently no license file in the repository, so no license is implied — treat the code
            as "all rights reserved" unless the repository owner adds one.
          </p>
        </section>

        <section className="panel">
          <h2>More on this topic</h2>
          <p>
            Rather than just listing competing products, these are three kinds of references
            that make the thinking behind Inflowencer easier to trace: the research it builds
            on, the open standards a future connector could speak, and comparable systems
            already in the market.
          </p>

          <h3>Methodology &amp; research</h3>
          <ul>
            <li>
              <a
                href="https://www.sciencedirect.com/science/article/abs/pii/S0261517716301005"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mapping Cilento: Using geotagged social media data to characterize tourist flows
              </a>{' '}
              (Chua et al., 2016, <em>Tourism Management</em>) — very close to Inflowencer's core
              idea: deriving the spatial and temporal patterns of tourist movement from geotagged
              social-media data.
            </li>
            <li>
              <a href="https://arxiv.org/abs/2203.06015" target="_blank" rel="noopener noreferrer">
                Comparing Global Tourism Flows Measured by Official Census and Social Sensing
              </a>{' '}
              (Skora et al., 2022) — directly relevant to Inflowencer's planned next step:
              checking social-sensing data against classical tourism statistics as ground truth,
              and how far that comparison actually holds up.
            </li>
            <li>
              <a
                href="https://www.resetting.eu/geo-temporal-crowding-visualization/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Geo-temporal visualization of tourist crowding
              </a>{' '}
              (Simões, Brito e Abreu &amp; Lopes, 2025, RESETTING project) — the closest thing to
              a scientific relative of Inflowencer we've found: historical data, pattern
              detection, trends, forecasts, and an extensible connector architecture for tourism
              crowding, drawing on sources including mobile-network and pedestrian-counter data.
              Conceptually, it's remarkably close to where Inflowencer is headed: multiple data
              sources → connectors → spatio-temporal analysis → trends/forecast → decision
              support against tourist overcrowding.
            </li>
          </ul>

          <h3>Open geo &amp; sensor standards</h3>
          <ul>
            <li>
              <a href="https://www.ogc.org/standards/ogcapi-features/" target="_blank" rel="noopener noreferrer">
                OGC API – Features
              </a>{' '}
              (Open Geospatial Consortium) — a modern standard for retrieving and querying
              spatial features over web APIs; a natural fit for future municipal or tourism data
              connectors.
            </li>
            <li>
              <a href="https://www.ogc.org/standards/sensorthings/" target="_blank" rel="noopener noreferrer">
                OGC SensorThings API
              </a>{' '}
              (Open Geospatial Consortium) — a standardized interface for sensors, observations,
              and metadata; relevant for pedestrian counters, traffic sensors, parking occupancy,
              or other real visitor-flow data.
            </li>
          </ul>

          <h3>Related software &amp; tourism intelligence</h3>
          <ul>
            <li>
              <a href="https://mabrian.com/" target="_blank" rel="noopener noreferrer">
                Data Appeal / Mabrian — Destination Intelligence
              </a>{' '}
              — a commercial tourism-intelligence platform combining multiple data sources for
              demand, visitor flow, destination performance, and sustainable destination
              management. Functionally much larger than Inflowencer, but a useful reference point
              for the product category.
            </li>
          </ul>
        </section>
      </main>

      <Footer />

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => {
            setLightbox(null)
          }}
        />
      )}
    </div>
  )
}
