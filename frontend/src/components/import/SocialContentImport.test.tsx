import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/testUtils'
import { SocialContentImport } from './SocialContentImport'

function jsonFile(content: string, name = 'fixture.json'): File {
  return new File([content], name, { type: 'application/json' })
}

describe('SocialContentImport', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a validation error for a file that is not valid JSON', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SocialContentImport />)

    await user.type(screen.getByLabelText(/source name/i), 'synthetic-batch')
    await user.upload(screen.getByLabelText(/json fixture file/i), jsonFile('{not valid json'))
    await user.click(screen.getByRole('button', { name: /import social content/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not read the file as json/i)
  })

  it('shows a validation error when required item fields are missing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SocialContentImport />)

    await user.type(screen.getByLabelText(/source name/i), 'synthetic-batch')
    await user.upload(
      screen.getByLabelText(/json fixture file/i),
      jsonFile(JSON.stringify([{ platform: 'instagram' }])),
    )
    await user.click(screen.getByRole('button', { name: /import social content/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/expected an array of social-content items/i)
  })

  it('submits valid items and renders the returned import report', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              received: 1,
              created: 1,
              updated: 0,
              skipped: 0,
              invalid: 0,
              duplicates: 0,
              warnings: [],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<SocialContentImport />)

    await user.type(screen.getByLabelText(/source name/i), 'synthetic-batch')
    await user.upload(
      screen.getByLabelText(/json fixture file/i),
      jsonFile(JSON.stringify([{ platform: 'instagram', published_at: '2026-01-01T00:00:00Z' }])),
    )
    await user.click(screen.getByRole('button', { name: /import social content/i }))

    await waitFor(() => {
      expect(screen.getByText('Created')).toBeInTheDocument()
    })
  })
})
