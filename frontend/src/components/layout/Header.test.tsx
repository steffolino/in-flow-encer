import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/testUtils'
import { Header } from './Header'

function renderHeader(showTenantSwitcher = false): void {
  renderWithProviders(
    <MemoryRouter>
      <Header showTenantSwitcher={showTenantSwitcher} />
    </MemoryRouter>,
  )
}

describe('Header', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not show tenant selection by default', () => {
    renderHeader()

    expect(screen.queryByLabelText(/tenant \(dev\)/i)).not.toBeInTheDocument()
  })

  it('shows tenant selection when explicitly enabled for the map view', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )

    renderHeader(true)

    expect(await screen.findByLabelText(/tenant \(dev\)/i)).toBeInTheDocument()
  })
})
