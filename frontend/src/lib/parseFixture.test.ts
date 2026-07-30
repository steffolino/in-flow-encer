import { describe, expect, it } from 'vitest'
import { parseSocialContentFixture } from './parseFixture'

describe('parseSocialContentFixture', () => {
  it('accepts a bare array of valid items', () => {
    const result = parseSocialContentFixture(
      JSON.stringify([{ platform: 'instagram', published_at: '2026-01-01T00:00:00Z' }]),
    )
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.items).toHaveLength(1)
      expect(result.items[0]?.platform).toBe('instagram')
    }
  })

  it('accepts an object wrapping items in an "items" field', () => {
    const result = parseSocialContentFixture(
      JSON.stringify({ items: [{ platform: 'tiktok', published_at: '2026-01-02T00:00:00Z' }] }),
    )
    expect(result.status).toBe('ok')
  })

  it('reports invalid-json for unparseable text', () => {
    const result = parseSocialContentFixture('{not json')
    expect(result.status).toBe('invalid-json')
  })

  it('reports invalid-shape when required fields are missing', () => {
    const result = parseSocialContentFixture(JSON.stringify([{ platform: 'instagram' }]))
    expect(result.status).toBe('invalid-shape')
  })

  it('reports invalid-shape for a non-array, non-items payload', () => {
    const result = parseSocialContentFixture(JSON.stringify({ foo: 'bar' }))
    expect(result.status).toBe('invalid-shape')
  })
})
