import { useFilters } from '../../state/filters'

/** Known filter option lists. In a real system these would likely come from
 * the backend (e.g. distinct platforms/regions seen in the data); the
 * contract does not expose such an endpoint yet, so we offer a fixed,
 * clearly-labeled set plus free text is avoided in favor of accessible
 * native selects. */
const PLATFORM_OPTIONS = ['instagram', 'tiktok', 'facebook', 'x', 'youtube']
// Must match the `region` field on Place rows (see backend/seed/gazetteer.py)
// exactly, since this value is sent straight through as a query filter.
const REGION_OPTIONS = ['Werdenfelser Land', 'Berchtesgadener Land', 'Oberland']
const AUTHOR_CATEGORY_OPTIONS = ['visitor', 'local', 'business', 'influencer', 'tourism_board']

export function FilterPanel(): React.JSX.Element {
  const { filters, dispatch } = useFilters()

  return (
    <section className="panel" aria-labelledby="filters-heading">
      <h2 id="filters-heading">Filters</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <div className="field-row">
          <div className="field">
            <label htmlFor="filter-date-from">From date</label>
            <input
              id="filter-date-from"
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(event) => {
                dispatch({ type: 'SET_DATE_FROM', value: event.target.value })
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="filter-date-to">To date</label>
            <input
              id="filter-date-to"
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(event) => {
                dispatch({ type: 'SET_DATE_TO', value: event.target.value })
              }}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="filter-platform">Platform</label>
          <select
            id="filter-platform"
            value={filters.platform}
            onChange={(event) => {
              dispatch({ type: 'SET_PLATFORM', value: event.target.value })
            }}
          >
            <option value="">All platforms</option>
            {PLATFORM_OPTIONS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="filter-region">Region</label>
          <select
            id="filter-region"
            value={filters.region}
            onChange={(event) => {
              dispatch({ type: 'SET_REGION', value: event.target.value })
            }}
          >
            <option value="">All regions</option>
            {REGION_OPTIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="filter-source">Source ID</label>
          <input
            id="filter-source"
            type="text"
            placeholder="e.g. src_import_42"
            value={filters.sourceId}
            onChange={(event) => {
              dispatch({ type: 'SET_SOURCE_ID', value: event.target.value })
            }}
          />
        </div>

        <div className="field">
          <label htmlFor="filter-author-category">Author category</label>
          <select
            id="filter-author-category"
            value={filters.authorCategory}
            onChange={(event) => {
              dispatch({ type: 'SET_AUTHOR_CATEGORY', value: event.target.value })
            }}
          >
            <option value="">All author categories</option>
            {AUTHOR_CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => {
            dispatch({ type: 'RESET' })
          }}
        >
          Reset filters
        </button>
      </form>
    </section>
  )
}
