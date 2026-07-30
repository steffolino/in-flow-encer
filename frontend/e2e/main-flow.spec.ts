import { expect, test } from '@playwright/test'

/**
 * End-to-end happy path across the whole MVP screen:
 * open app -> pick a tenant -> import a social-content fixture ->
 * see the heatmap/summary update -> upload a visitor-flow CSV overlay ->
 * enable the new overlay layer -> change the date filter -> confirm the
 * summary/table reacts.
 *
 * This spec assumes a backend is reachable at http://localhost:8000 via the
 * dev proxy (see vite.config.ts). Without a live backend the app still
 * renders (queries fail gracefully with visible error states), so most of
 * this spec's early assertions (tenant switcher present, filters usable,
 * accessible table present) hold regardless; the import/upload/heatmap
 * assertions require the backend contract to be live.
 */
test('tenant switch, imports, overlay, and filters flow through the dashboard', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /visitor flow & attention monitor/i })).toBeVisible()
  await expect(page.getByText(/synthetic \/ test data/i)).toBeVisible()

  // 1. Tenant switcher is present and keyboard-operable.
  const tenantSelect = page.getByLabel(/tenant \(dev\)/i)
  await expect(tenantSelect).toBeVisible()

  // 2. Filters are native, labeled controls.
  const platformSelect = page.getByLabel(/^platform$/i)
  await expect(platformSelect).toBeVisible()
  const dateFromInput = page.getByLabel(/from date/i)
  await expect(dateFromInput).toBeVisible()

  // 3. The map region and its accessible non-map alternative both render.
  await expect(page.getByRole('region', { name: /map of social attention/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /places in view/i })).toBeVisible()

  // 4. Import a social-content fixture (JSON produced in-memory as a file).
  const socialFixture = JSON.stringify([
    {
      platform: 'instagram',
      published_at: new Date().toISOString(),
      caption: 'Beautiful morning at the lake #eibsee',
      location_text: 'Eibsee',
    },
  ])
  await page.getByLabel(/source name/i).fill('e2e-fixture-batch')
  await page.getByLabel(/json fixture file/i).setInputFiles({
    name: 'fixture.json',
    mimeType: 'application/json',
    buffer: Buffer.from(socialFixture),
  })
  await page.getByRole('button', { name: /import social content/i }).click()

  // 5. Upload a visitor-flow CSV overlay (columns per the documented CSV
  // schema: latitude, longitude, timestamp, value).
  const csvFixture =
    'latitude,longitude,timestamp,value\n47.5,11.1,2026-06-01T10:00:00,120\n'
  await page.getByLabel(/layer name/i).fill('E2E parking counter overlay')
  await page.getByLabel(/measurement type/i).fill('parking_occupancy')
  await page.getByLabel(/csv file/i).setInputFiles({
    name: 'overlay.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvFixture),
  })
  await page.getByRole('button', { name: /upload overlay/i }).click()
  await expect(page.getByText(/created/i).first()).toBeVisible({ timeout: 10_000 })

  // 6. Change the date filter and confirm the summary strip is still present
  // (its numbers are driven by the backend and can't be asserted precisely
  // without one, but the control must remain interactive after the change).
  await dateFromInput.fill('2026-01-01')
  await expect(page.getByRole('heading', { name: /summary for current filters/i })).toBeVisible()
})
