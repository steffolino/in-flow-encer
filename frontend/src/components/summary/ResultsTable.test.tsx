import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResultsTable } from './ResultsTable'
import type { AttentionCell } from '../../api/schemas'

const cell: AttentionCell = {
  place_id: 'p1',
  place_name: 'Eibsee',
  lon: 11.1,
  lat: 47.5,
  post_count: 12,
  total_reach: 5000,
  total_engagement: 300,
  unique_creators: 8,
  change_vs_previous_period: 0.25,
  avg_confidence: 0.8,
  attention_score: 0.72,
}

const noop = (): void => {
  // no-op default for tests that don't assert on selection
}

describe('ResultsTable', () => {
  it('shows a loading status message while loading', () => {
    render(<ResultsTable cells={[]} isLoading isError={false} selectedPlaceId={null} onSelectPlace={noop} />)
    expect(screen.getByText(/loading attention data/i)).toBeInTheDocument()
  })

  it('shows an accessible error message on failure', () => {
    render(<ResultsTable cells={[]} isLoading={false} isError selectedPlaceId={null} onSelectPlace={noop} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/could not load attention data/i)
  })

  it('shows an empty state when there are no matching places', () => {
    render(
      <ResultsTable cells={[]} isLoading={false} isError={false} selectedPlaceId={null} onSelectPlace={noop} />,
    )
    expect(screen.getByText(/no places match the current filters/i)).toBeInTheDocument()
  })

  it('renders every visible place as an accessible table row', () => {
    render(
      <ResultsTable
        cells={[cell]}
        isLoading={false}
        isError={false}
        selectedPlaceId={null}
        onSelectPlace={noop}
      />,
    )
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Eibsee' })).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('0.72')).toBeInTheDocument()
  })

  it('calls onSelectPlace when a place name is clicked', async () => {
    const onSelectPlace = vi.fn()
    const user = userEvent.setup()
    render(
      <ResultsTable
        cells={[cell]}
        isLoading={false}
        isError={false}
        selectedPlaceId={null}
        onSelectPlace={onSelectPlace}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Eibsee' }))
    expect(onSelectPlace).toHaveBeenCalledWith('p1')
  })

  it('marks the selected place as pressed and highlighted', () => {
    render(
      <ResultsTable
        cells={[cell]}
        isLoading={false}
        isError={false}
        selectedPlaceId="p1"
        onSelectPlace={noop}
      />,
    )
    expect(screen.getByRole('button', { name: /Eibsee/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
