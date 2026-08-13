import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { ArchitectureDiagram } from '../components/diagram/ArchitectureDiagram'
import { PipelineStepper } from '../components/diagram/PipelineStepper'

/**
 * A plain-language explanation of what this MVP is, how the forecast is
 * computed, what has and hasn't been validated, and the privacy/open-source
 * stance — written to stay accurate to the code, not aspirational. See
 * docs/architecture.md and docs/adr/0008-naive-trend-forecast.md for the
 * engineering-level versions of the same claims.
 */
export function AboutPage(): React.JSX.Element {
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
          <p>
            The system is one straight pipeline, kept deliberately simple end to end. Select any
            stage below for what it actually does:
          </p>

          <figure className="about-figure">
            <PipelineStepper />
            <figcaption>
              Social content and customer uploads converge on the map through deterministic
              matching, storage, and aggregation. See "Forecast methodology" below and ADR 0008
              for the full decision record.
            </figcaption>
          </figure>

          <p>
            Every stage is deterministic and auditable: location matching uses a fixed-order,
            fixed-confidence pipeline (never fuzzy, never guessed), and the attention/forecast
            scores are documented formulas over real counts, not learned parameters. A future
            pull-based data source (a municipal API, a sensor feed) plugs into an existing
            connector interface without changing anything upstream of it — the same is true for
            swapping the forecast method for a real statistical model later.
          </p>

          <figure className="about-figure">
            <ArchitectureDiagram />
            <figcaption>
              A closer, more technical look at the same architecture: backend module boundaries
              and the direction dependencies point in. Select a chip for detail; the future chip is
              the one piece that is not built yet.
            </figcaption>
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
          <h2>Research direction</h2>
          <p>
            A next research and development step would investigate whether this geospatial
            pipeline can combine indicators of human pressure with protected-area, habitat,
            species, and environmental data to support conservation monitoring and management.
          </p>
          <p>
            Key open questions include how reliably digital attention signals reflect actual
            spatial pressure, how these signals can be validated against observed visitor data,
            and how ecological sensitivity and uncertainty should be represented without
            conflating human presence with ecological impact.
          </p>
          <p>
            The intended next step is a real-world pilot with a protected-area or conservation
            partner using actual monitoring and environmental data. See "Where this could go"
            below for the full target architecture and supporting literature.
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
            , including the architecture docs and every ADR referenced on this page, under the{' '}
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              GNU Affero General Public License v3.0 (AGPL-3.0)
            </a>
            . AGPL-3.0 is copyleft: anyone who modifies this code and runs it as a network service
            (not just anyone who redistributes it) must also make their modified source available
            to users of that service — it exists specifically to keep server-side software open.
          </p>
        </section>

        <section className="panel about-vision">
          <span className="about-vision-badge">Vision — not built</span>
          <h2>Where this could go</h2>
          <p>
            Everything above this section describes what actually runs today. This section is
            the opposite: a target architecture the current pipeline generalizes toward, none of
            which exists yet. It's here so the direction is explicit rather than implied —
            nothing below should be mistaken for a shipped feature.
          </p>
          <p>
            The current MVP does one thing: turn social-media attention into a tourism signal.
            The underlying pipeline — ingest → normalize → georeference → aggregate → analyze →
            present — doesn't have to stop there. The same shape could carry environmental
            monitoring signals alongside tourism ones, with tourism becoming <em>one application
            on a broader platform</em> rather than the platform's only purpose. Nothing about the
            current tourism use case would be removed or replaced by this — it would just stop
            being the only thing the pipeline is used for.
          </p>

          <div className="vision-modules">
            <div className="vision-module">
              <h3>Inflowencer Core</h3>
              <ul>
                <li>Ingestion</li>
                <li>Normalization</li>
                <li>Georeferencing</li>
                <li>Time series</li>
                <li>Provenance</li>
                <li>Quality information</li>
              </ul>
              <p className="vision-today">
                Today: ingestion, deterministic georeferencing, and per-match confidence already
                exist for social content. Dedicated time-series storage and formal
                provenance/quality metadata do not.
              </p>
            </div>

            <div className="vision-module">
              <h3>Pressure Intelligence</h3>
              <ul>
                <li>Social / web</li>
                <li>Visitors</li>
                <li>Mobility</li>
                <li>Events</li>
              </ul>
              <p className="vision-today">
                Today: social/web attention is the entire current signal. Visitor data exists
                only as customer-uploaded CSV/GeoJSON overlays (parking, footfall counters) — no
                mobility or event data source exists.
              </p>
            </div>

            <div className="vision-module">
              <h3>Nature Intelligence</h3>
              <ul>
                <li>Protected areas</li>
                <li>Habitats</li>
                <li>Species</li>
                <li>Biodiversity indicators</li>
                <li>Environmental / satellite data</li>
              </ul>
              <p className="vision-today">
                Today: none of this exists. The sample data includes one protected-areas GeoJSON
                file, but it's loaded as a generic overlay layer, not a dedicated nature-data
                domain.
              </p>
            </div>

            <div className="vision-module">
              <h3>Analysis</h3>
              <ul>
                <li>Baselines</li>
                <li>Anomalies</li>
                <li>Trends</li>
                <li>Spatial overlays</li>
                <li>Forecasts (later)</li>
                <li>Confidence / uncertainty</li>
              </ul>
              <p className="vision-today">
                Today: period-over-period trend, the naive forecast, and confidence bands already
                exist. Anomaly detection and true spatial-overlay analysis (beyond a fixed-radius
                proximity check) do not.
              </p>
            </div>

            <div className="vision-module">
              <h3>Decision Support</h3>
              <ul>
                <li>Maps</li>
                <li>Hotspots</li>
                <li>Time series</li>
                <li>Causes / signals</li>
                <li>Domain annotation</li>
                <li>Measures</li>
                <li>Evaluation</li>
              </ul>
              <p className="vision-today">
                Today: the map and attention "hotspot" markers exist, plus a basic forecast-driver
                breakdown. Time-series charts, domain annotation, recommended measures, and
                evaluation tooling do not.
              </p>
            </div>
          </div>

          <h3>Further reading for this direction</h3>
          <p>
            Not a fundraising reading list — the question here is what already works
            scientifically for a Nature Intelligence direction, and where the open problems are.
            If only three get read, these three would probably determine the hypotheses,
            validation method, and data architecture directly:
          </p>
          <ol className="vision-reading-priority">
            <li>
              <a href="https://link.springer.com/article/10.1007/s00267-020-01373-7" target="_blank" rel="noopener noreferrer">
                Wilkins, Wood &amp; Smith (2021) — Uses and Limitations of Social Media to Inform
                Visitor Use Management in Parks and Protected Areas
              </a>
              . A systematic review specifically on social media + protected areas + visitor
              management: what can actually be inferred about visitor numbers, spatial use, and
              behavior — and where the limits are. Probably the single most load-bearing paper
              for this direction's methodology: validation, uncertainty, bias correction, and
              data-source selection all trace back to it.
            </li>
            <li>
              <a href="https://www.sciencedirect.com/science/article/pii/S0006320718317609" target="_blank" rel="noopener noreferrer">
                Toivonen et al. (2019) — Social media data for conservation science
              </a>
              . A methodological overview of how social-media data is used in conservation
              research — spatial usage patterns, human presence, preferences, content, combining
              it with other geodata — plus bias, data access, and validation. Functions as the
              scientific grounding for the social/geo pipeline this MVP already has.
            </li>
            <li>
              <a href="https://www.mdpi.com/2220-9964/6/3/85" target="_blank" rel="noopener noreferrer">
                Heikinheimo et al. (2017) — User-Generated Geographic Information for Visitor
                Monitoring in a National Park
              </a>
              . A concrete comparison of social-media data against classical visitor surveys in a
              national park — the missing ground-truth validation step this MVP itself doesn't
              have yet: signal → predicted spatial pressure → compare against visitor
              counters/surveys/mobility data.
            </li>
          </ol>
          <ul>
            <li>
              <a href="https://www.nature.com/articles/s41598-017-18007-4" target="_blank" rel="noopener noreferrer">
                Tenkanen et al. (2017) — Instagram, Flickr, or Twitter: Assessing the usability of
                social media data for visitor monitoring in protected areas
              </a>
              — compares platforms' suitability for protected-area visitor monitoring; relevant
              before deciding which sources belong in this pipeline, since more sources isn't
              automatically better data.
            </li>
            <li>
              <a href="https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0167259" target="_blank" rel="noopener noreferrer">
                Larson et al. (2016) — Effects of Recreation on Animals Revealed as Widespread
                through a Global Systematic Review
              </a>
              — the other half of the equation: not "can we detect visitors" but "why is visitor
              pressure an ecological problem at all." Documents that negative effects of
              recreation on animals show up widely across contexts, but that effect size and
              direction vary by species, activity, and situation — not a universal harm claim.
              Human presence and ecological impact would need to be modeled separately, not
              conflated, and "presence detected" would not by itself imply "impact occurred."
            </li>
            <li>
              <a href="https://iucn.org/resources/publication/tourism-and-visitor-management-protected-areas" target="_blank" rel="noopener noreferrer">
                IUCN (2018) — Tourism and Visitor Management in Protected Areas
              </a>
              — domain knowledge rather than data science: sustainable visitor management,
              monitoring, interventions, and evaluation in real protected-area practice. A guard
              against building a technically interesting dashboard that doesn't fit how a
              protected-area authority actually works — signal → interpretation → decision →
              measure → evaluation, not just signal → map.
            </li>
            <li>
              <a href="https://www.sciencedirect.com/science/article/pii/S259033222300088X" target="_blank" rel="noopener noreferrer">
                Ghermandi et al. (2023) — Social media data for environmental sustainability
              </a>
              — a broader, more recent review covering data quality, access restrictions, and
              ethical risk: what a signal is actually allowed to justify claiming.
            </li>
          </ul>

          <h3>Concrete data sources for this direction</h3>
          <ul>
            <li>
              <a href="https://www.bfn.de/daten-und-fakten/kartenanwendung-schutzgebiete-deutschland" target="_blank" rel="noopener noreferrer">
                BfN protected areas (Germany)
              </a>
              — nature reserves, national parks, biosphere reserves, Natura 2000/FFH areas, with
              a{' '}
              <a href="https://geodienste.bfn.de/ogc/wfs/schutzgebiet" target="_blank" rel="noopener noreferrer">
                WFS download service
              </a>{' '}
              already available.
            </li>
            <li>
              <a href="https://www.bfn.de/lebensraumtypen" target="_blank" rel="noopener noreferrer">
                BfN FFH habitat types
              </a>
              — "inside a protected area" alone is ecologically coarse; habitat type would let
              pressure be weighed against ecological sensitivity instead of a flat true/false.
            </li>
            <li>
              <a href="https://www.gbif.org/" target="_blank" rel="noopener noreferrer">
                GBIF
              </a>{' '}
              — georeferenced species-occurrence data. Paired with{' '}
              <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC2879389/" target="_blank" rel="noopener noreferrer">
                Boakes et al. (2010) — Distorted Views of Biodiversity
              </a>
              , which documents that no observation doesn't mean no species — that uncertainty
              belongs in the data model, not silently dropped in the frontend.
            </li>
            <li>
              <a href="https://documentation.dataspace.copernicus.eu/Data/CopernicusServices/CLMS.html" target="_blank" rel="noopener noreferrer">
                Copernicus Land Monitoring Service
              </a>
              — the likely source for a future environment-state layer: land cover, vegetation
              state (
              <a href="https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/clms/bio-geophysical-parameters/vegetation/vegetation-indices/ndvi_global_300m_10daily_v2.html" target="_blank" rel="noopener noreferrer">
                NDVI
              </a>
              ), and{' '}
              <a href="https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/clms/bio-geophysical-parameters/soil-moisture/soil-water-index/swi_europe_1km_daily_v1.html" target="_blank" rel="noopener noreferrer">
                soil moisture
              </a>
              . Lowest priority of this list — after protected areas and ground-truth validation.
            </li>
          </ul>
        </section>

        <section className="panel">
          <h2>More on this topic</h2>
          <p>
            Separate from the Nature Intelligence reading list above (which is about the
            not-yet-built vision direction), these three kinds of references ground the
            tourism-attention product that actually exists today: the research it builds on,
            the open standards a future connector could speak, and comparable systems already
            in the market — not competing products for their own sake.
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
    </div>
  )
}
