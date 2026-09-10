import { describe, expect, it, vi, afterEach } from 'vitest'
import rawSnapshot from '../../public/demo/snapshot.json'
import checks from './demo.expected.json'
import { demoRequest, demoSnapshotSchema, resolveDemo } from './demo'
import { socialContentPageSchema } from './schemas'

const snapshot = demoSnapshotSchema.parse(rawSnapshot)
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing demo test data')
  return value
}
// generated_at is the snapshot timestamp, not the backend's wall clock.
// Compare by ID because the DB does not promise ordering among equal scores.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== 'generated_at').map(([key, item]) => [key, canonical(item)]))
  return value
}

describe('static demo', () => {
  afterEach(() => vi.unstubAllGlobals())
  for (const check of checks) {
    it(`matches FastAPI: ${check.slug} ${check.path}`, async () => {
      const response = resolveDemo(snapshot, check.path, check.slug)
      expect(response.status).toBe(200)
      expect(canonical(await response.json())).toEqual(canonical(check.expected))
    })
  }
  it('paginates and filters posts without crossing tenants', async () => {
    const slug = required(snapshot.tenants[0]).slug
    const data = required(snapshot.data[slug])
    const item = required(data.items[0])
    const path = `/social-content?platform=${item.platform}&source_id=${item.source_id}&limit=1&offset=1`
    const result = socialContentPageSchema.parse(await resolveDemo(snapshot, path, slug).json())
    const filtered = data.items.filter(i => i.platform === item.platform && i.source_id === item.source_id)
      .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
    expect(result.total).toBe(filtered.length)
    expect(result.items.map((i: { id: string }) => i.id)).toEqual(filtered.slice(1, 2).map(i => i.id))
  })
  it('rejects missing tenants and cross-tenant overlay IDs', () => {
    expect(resolveDemo(snapshot, '/overlays', null).status).toBe(404)
    const first = required(snapshot.tenants[0]), second = required(snapshot.tenants[1])
    const overlay = required(required(snapshot.data[first.slug]).overlays[0])
    expect(resolveDemo(snapshot, `/overlays/${overlay.id}/features`, second.slug).status).toBe(404)
  })
  it('rejects writes without making network requests', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    for (const method of ['POST', 'PATCH', 'DELETE']) {
      expect((await demoRequest('/overlays', required(snapshot.tenants[0]).slug, method)).status).toBe(405)
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
