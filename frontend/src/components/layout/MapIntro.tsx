import { useState } from 'react'

/** Map-page-specific intro copy and synthetic-data banner — not part of the shared Header. */
export function MapIntro(): React.JSX.Element {
  const [expanded, setExpanded] = useState(true)

  return (
    <>
      <section className="app-intro">
        <div className="app-intro-header">
          <h2>What is this?</h2>
          <button
            type="button"
            className="btn btn-secondary app-intro-toggle"
            aria-expanded={expanded}
            onClick={() => {
              setExpanded((value) => !value)
            }}
          >
            {expanded ? 'Hide intro' : 'Show intro'}
          </button>
        </div>
        {expanded && (
          <div className="app-intro-body">
            <p>
              Social-media buzz about a place often shows up days before the visitors do, but
              tourism boards have no easy way to see it coming or to check it against what's
              actually happening on the ground. Inflowencer maps public social-media attention
              around places in the Bavarian Alps side by side with your own visitor-flow data
              (footfall, parking, transit counts), so you can spot where attention is building
              before it turns into crowds. Explore the map, filter by date/platform/region,
              toggle attention and visitor-flow layers, compare the two, and import your own
              data — all from the controls around the map.
            </p>
            <figure className="app-intro-figure">
              <img
                src="/img/overtourism-alpine-lake.png"
                alt="A crowded Bavarian alpine lake shoreline packed with hikers, with the water
                  covered edge-to-edge by paddleboarders and swimmers, illustrating how quickly a
                  popular spot can turn into a crowd once attention builds."
              />
              <figcaption>
                A popular Alpine lake at peak crowding — the kind of moment Inflowencer aims to
                help you see coming, not just confirm after it happens. (AI-generated illustration,
                not a real photo.)
              </figcaption>
            </figure>
          </div>
        )}
      </section>
      <div className="synthetic-data-banner" role="note">
        <span className="badge badge-synthetic">Test data</span>{' '}
        All places, social content, and visitor-flow overlays shown here are synthetic
        data for the Bavarian Alps MVP — nothing on this screen reflects real visitors.
      </div>
    </>
  )
}
