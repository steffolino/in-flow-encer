import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForecastPanel } from './ForecastPanel'
import type { ForecastCell } from '../../api/schemas'

const cell: ForecastCell = {
  place_id: 'p1',
  place_name: 'Zugspitze',
  lon: 10.9852,
  lat: 47.421,
  attention_score: 0.5,
  forecast_score: 0.75,
  forecast_score_low: 0.68,
  forecast_score_high: 0.83,
  trend_pct: 50,
  confidence: 'high',
  drivers: { post_count: 0.4, reach: 0.35, engagement: 0.25 },
}

describe('ForecastPanel', () => {
  it('shows a loading state', () => {
    render(<ForecastPanel cells={[]} notYetConnected={[]} isLoading isError={false} />)
    expect(screen.getByText(/loading forecast/i)).toBeInTheDocument()
  })

  it('shows an accessible error state', () => {
    render(<ForecastPanel cells={[]} notYetConnected={[]} isLoading={false} isError />)
    expect(screen.getByRole('alert')).toHaveTextContent(/could not load/i)
  })

  it('shows an empty state', () => {
    render(<ForecastPanel cells={[]} notYetConnected={[]} isLoading={false} isError={false} />)
    expect(screen.getByText(/no forecast data/i)).toBeInTheDocument()
  })

  it('renders current vs. projected scores, trend, range, and confidence', () => {
    render(<ForecastPanel cells={[cell]} notYetConnected={[]} isLoading={false} isError={false} />)
    expect(screen.getByText(/current: 0\.50/i)).toBeInTheDocument()
    expect(screen.getByText(/projected: 0\.75/i)).toBeInTheDocument()
    expect(screen.getByText(/\+50\.0%/)).toBeInTheDocument()
    expect(screen.getByText(/0\.68–0\.83/)).toBeInTheDocument()
    expect(screen.getByText(/high confidence/i)).toBeInTheDocument()
  })

  it('lists which signals are not yet connected, without implying they were used', () => {
    render(
      <ForecastPanel
        cells={[cell]}
        notYetConnected={['weather', 'events/ticketing']}
        isLoading={false}
        isError={false}
      />,
    )
    expect(screen.getByText(/weather, events\/ticketing are not part of this projection yet/i)).toBeInTheDocument()
  })
})
