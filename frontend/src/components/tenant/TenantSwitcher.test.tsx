import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/testUtils'
import { TenantSwitcher } from './TenantSwitcher'

const tenants = [
  { id: '1', name: 'Garmisch Tourism Board', slug: 'garmisch', created_at: '2026-01-01T00:00:00Z' },
  { id: '2', name: 'Berchtesgaden Tourism Board', slug: 'berchtesgaden', created_at: '2026-01-01T00:00:00Z' },
]

describe('TenantSwitcher', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(tenants), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads tenants and lets the user switch the active one via a labeled select', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TenantSwitcher />)

    const select = await screen.findByLabelText(/tenant \(dev\)/i)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Garmisch Tourism Board' })).toBeInTheDocument()
    })

    await user.selectOptions(select, 'berchtesgaden')
    expect(select).toHaveValue('berchtesgaden')
    expect(window.localStorage.getItem('inflow-encer:tenant-slug')).toBe('berchtesgaden')
  })

  it('auto-selects the first tenant once the list loads if none is chosen yet', async () => {
    renderWithProviders(<TenantSwitcher />)
    const select = await screen.findByLabelText(/tenant \(dev\)/i)
    await waitFor(() => {
      expect(select).toHaveValue('garmisch')
    })
  })
})
