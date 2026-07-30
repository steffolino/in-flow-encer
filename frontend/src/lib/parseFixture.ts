import { socialContentImportItemsSchema, type SocialContentImportItem } from '../api/schemas'

export type FixtureParseResult =
  | { status: 'ok'; items: SocialContentImportItem[] }
  | { status: 'invalid-json'; message: string }
  | { status: 'invalid-shape'; message: string }

/**
 * Parses a user-selected JSON fixture file into social-content import
 * items. Accepts either a bare array of items or `{ items: [...] }`.
 * Never throws — callers get a discriminated result to render.
 */
export function parseSocialContentFixture(raw: string): FixtureParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    return {
      status: 'invalid-json',
      message: error instanceof Error ? error.message : 'The file is not valid JSON.',
    }
  }

  const candidate =
    typeof parsed === 'object' && parsed !== null && 'items' in parsed ? parsed.items : parsed

  const result = socialContentImportItemsSchema.safeParse(candidate)
  if (!result.success) {
    return {
      status: 'invalid-shape',
      message:
        'Expected an array of social-content items (or { "items": [...] }) with at least ' +
        '"platform" and "published_at" on each entry.',
    }
  }

  return { status: 'ok', items: result.data }
}
