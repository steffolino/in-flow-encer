import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/testUtils'
import { TimeRangeSlider } from './TimeRangeSlider'
import { pilotWindowMonths } from '../../lib/dateRange'
import { useFilters } from '../../state/filters'

function CurrentRange(): React.JSX.Element {
  const { filters } = useFilters()
  return <div data-testid="current-range">{`${filters.dateFrom}..${filters.dateTo}`}</div>
}

describe('TimeRangeSlider', () => {
  it('starts labeled "All months" spanning the full pilot window', () => {
    renderWithProviders(<TimeRangeSlider />)
    expect(screen.getByText(/all months/i)).toBeInTheDocument()
  })

  it('narrows the shared date filters to a single month when moved', () => {
    renderWithProviders(
      <>
        <TimeRangeSlider />
        <CurrentRange />
      </>,
    )
    const months = pilotWindowMonths()
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '1' } })

    expect(screen.getByText(months[1]?.label ?? '')).toBeInTheDocument()
    expect(screen.getByTestId('current-range')).toHaveTextContent(`${months[1]?.from}..${months[1]?.to}`)
  })

  it('resets to the full pilot window via "Show all"', () => {
    renderWithProviders(
      <>
        <TimeRangeSlider />
        <CurrentRange />
      </>,
    )
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '2' } })
    expect(screen.queryByText(/all months/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /show all/i }))
    expect(screen.getByText(/all months/i)).toBeInTheDocument()
  })
})
