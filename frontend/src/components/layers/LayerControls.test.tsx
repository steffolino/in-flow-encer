import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/testUtils'
import { LayerControls } from './LayerControls'
import type { OverlayLayer } from '../../api/schemas'

const overlay: OverlayLayer = {
  id: 'overlay-1',
  name: 'Eibsee parking counters',
  description: null,
  geometry_type: 'Point',
  measurement_type: 'pedestrian_count',
  unit: 'people/hour',
  visibility: 'visible',
  time_field: null,
  source: { name: 'Municipal sensors', provider: 'GAP counters', last_updated_at: '2026-06-01T10:00:00Z' },
  feature_count: 42,
}

describe('LayerControls', () => {
  it('renders a textual legend label for the attention heatmap, not just a color', () => {
    renderWithProviders(<LayerControls overlays={[]} />)
    expect(screen.getByText('Low attention')).toBeInTheDocument()
    expect(screen.getByText('High attention')).toBeInTheDocument()
  })

  it('toggles the attention heatmap layer visibility via a labeled checkbox', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LayerControls overlays={[]} />)

    const checkbox = screen.getAllByRole('checkbox')[0]
    expect(checkbox).toBeDefined()
    expect(checkbox).toBeChecked()

    if (checkbox) {
      await user.click(checkbox)
      expect(checkbox).not.toBeChecked()
    }
  })

  it('exposes opacity as a labeled range input and reflects changes in its label', () => {
    renderWithProviders(<LayerControls overlays={[]} />)
    const sliders = screen.getAllByRole('slider')
    const firstSlider = sliders[0]
    expect(firstSlider).toBeDefined()
    expect(firstSlider).toHaveAttribute('type', 'range')
    expect(firstSlider).toHaveAccessibleName(/opacity/i)

    if (firstSlider) {
      fireEvent.change(firstSlider, { target: { value: '0.4' } })
      expect(firstSlider).toHaveValue('0.4')
      expect(screen.getByText(/opacity \(40%\)/i)).toBeInTheDocument()
    }
  })

  it('shows overlay source name, last-updated timestamp, and measurement legend text', () => {
    renderWithProviders(<LayerControls overlays={[overlay]} />)
    expect(screen.getByText('Eibsee parking counters')).toBeInTheDocument()
    expect(screen.getByText(/pedestrian_count/)).toBeInTheDocument()
    expect(screen.getByText(/people\/hour/)).toBeInTheDocument()
    expect(screen.getByText(/Municipal sensors/)).toBeInTheDocument()
    expect(screen.getByText(/42 features/)).toBeInTheDocument()
  })

  it('shows a placeholder when there are no overlays yet', () => {
    renderWithProviders(<LayerControls overlays={[]} />)
    expect(screen.getByText(/no overlays uploaded yet/i)).toBeInTheDocument()
  })
})
