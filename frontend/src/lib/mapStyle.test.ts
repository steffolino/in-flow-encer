import { describe, expect, it } from 'vitest'
import { BASEMAP_STYLES } from './mapStyle'

function tileTemplates(styleKey: 'light' | 'dark'): string[] {
  const source = BASEMAP_STYLES[styleKey].sources.basemap
  if (source?.type !== 'raster') return []
  return source.tiles ?? []
}

describe('BASEMAP_STYLES', () => {
  it('uses CARTO light tiles for the light basemap', () => {
    expect(tileTemplates('light')).toEqual(
      expect.arrayContaining([expect.stringContaining('/light_all/')]),
    )
  })

  it('uses CARTO dark tiles for the dark basemap', () => {
    expect(tileTemplates('dark')).toEqual(
      expect.arrayContaining([expect.stringContaining('/dark_all/')]),
    )
  })
})
