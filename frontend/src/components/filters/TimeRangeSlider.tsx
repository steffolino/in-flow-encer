import { useFilters } from '../../state/filters'
import { pilotWindowMonths } from '../../lib/dateRange'

const MONTHS = pilotWindowMonths()

function indexForFilters(dateFrom: string): number {
  const index = MONTHS.findIndex((month) => dateFrom >= month.from && dateFrom <= month.to)
  return index === -1 ? 0 : index
}

/**
 * A coarse month-by-month slider over the pilot region's demo window,
 * driving the same `dateFrom`/`dateTo` filter state as the precise date
 * inputs in FilterPanel (no new filter state introduced). Meant to be the
 * fast, always-visible way to scrub through "when," while FilterPanel stays
 * the precise fallback for an exact custom range.
 */
export function TimeRangeSlider(): React.JSX.Element {
  const { filters, dispatch } = useFilters()
  const selectedIndex = indexForFilters(filters.dateFrom)
  const selectedMonth = MONTHS[selectedIndex]
  const isFullWindow = filters.dateFrom === MONTHS[0]?.from && filters.dateTo === MONTHS[MONTHS.length - 1]?.to

  const selectMonth = (index: number): void => {
    const month = MONTHS[index]
    if (!month) return
    dispatch({ type: 'SET_DATE_FROM', value: month.from })
    dispatch({ type: 'SET_DATE_TO', value: month.to })
  }

  const showFullWindow = (): void => {
    const first = MONTHS[0]
    const last = MONTHS[MONTHS.length - 1]
    if (!first || !last) return
    dispatch({ type: 'SET_DATE_FROM', value: first.from })
    dispatch({ type: 'SET_DATE_TO', value: last.to })
  }

  return (
    <div className="time-slider" role="group" aria-label="Time period">
      <label htmlFor="time-slider-input">
        {isFullWindow ? 'All months' : selectedMonth?.label ?? ''}
      </label>
      <input
        id="time-slider-input"
        type="range"
        min={0}
        max={MONTHS.length - 1}
        step={1}
        value={selectedIndex}
        onChange={(event) => {
          selectMonth(Number(event.target.value))
        }}
      />
      <button type="button" className="btn btn-secondary time-slider-reset" onClick={showFullWindow}>
        Show all
      </button>
    </div>
  )
}
