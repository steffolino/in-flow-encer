import { describe, expect, it } from 'vitest'
import { BASEMAP_STYLES } from './mapStyle'

describe('BASEMAP_STYLES', () => {
  it('uses a keyless CARTO vector style for the light basemap', () => {
    expect(BASEMAP_STYLES.light).toBe('https://basemaps.cartocdn.com/gl/positron-gl-style/style.json')
  })

  it('uses a keyless CARTO vector style for the dark basemap', () => {
    expect(BASEMAP_STYLES.dark).toBe('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json')
  })
})
