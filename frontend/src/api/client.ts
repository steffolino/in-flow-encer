/**
 * Single place responsible for talking to the backend over HTTP.
 *
 * All `fetch` calls in the app must go through this module. Every
 * response body is validated with a Zod schema from `schemas.ts` before
 * it is handed back to the caller, so a shape drift in the real backend
 * surfaces as a clear parsing error instead of `undefined` bugs deep in
 * a component.
 */
import type { ZodType } from 'zod'
import { apiErrorSchema } from './schemas'

// In local dev this stays '/api/v1' and Vite's dev-server proxy (vite.config.ts)
// forwards it to the backend. In a static production build (Cloudflare Pages
// etc.) there is no proxy, so VITE_API_BASE_URL must be baked in at build
// time to the backend's full public URL, e.g. https://api.example.com/api/v1.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  get isCrossTenant(): boolean {
    return this.status === 403 || this.status === 404
  }
}

export class ApiParseError extends Error {
  constructor(resource: string, cause: unknown) {
    super(`Received an unexpected response shape for "${resource}".`)
    this.name = 'ApiParseError'
    this.cause = cause
  }
}

let currentTenantSlug: string | null = null

export function setActiveTenantSlug(slug: string | null): void {
  currentTenantSlug = slug
}

export function getActiveTenantSlug(): string | null {
  return currentTenantSlug
}

function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  if (currentTenantSlug) {
    headers.set('X-Tenant-Slug', currentTenantSlug)
  }
  return headers
}

async function readErrorBody(response: Response): Promise<{ code: string; message: string; details?: unknown }> {
  const fallback = { code: 'unknown_error', message: `Request failed with status ${String(response.status)}` }
  try {
    const body: unknown = await response.json()
    const parsed = apiErrorSchema.safeParse(body)
    if (parsed.success) {
      return parsed.data.error
    }
    return fallback
  } catch {
    return fallback
  }
}

async function request<T>(
  path: string,
  schema: ZodType<T>,
  resourceName: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: buildHeaders(init?.headers),
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new ApiError(response.status, errorBody.code, errorBody.message, errorBody.details)
  }

  if (response.status === 204) {
    return schema.parse(undefined)
  }

  const json: unknown = await response.json()
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    throw new ApiParseError(resourceName, parsed.error)
  }
  return parsed.data
}

export function apiGet<T>(path: string, schema: ZodType<T>, resourceName: string): Promise<T> {
  return request(path, schema, resourceName, { method: 'GET' })
}

export function apiPostJson<T>(
  path: string,
  schema: ZodType<T>,
  resourceName: string,
  body: unknown,
): Promise<T> {
  return request(path, schema, resourceName, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiPostForm<T>(
  path: string,
  schema: ZodType<T>,
  resourceName: string,
  formData: FormData,
): Promise<T> {
  return request(path, schema, resourceName, {
    method: 'POST',
    body: formData,
  })
}

export function apiPatchJson<T>(
  path: string,
  schema: ZodType<T>,
  resourceName: string,
  body: unknown,
): Promise<T> {
  return request(path, schema, resourceName, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiDelete(path: string): Promise<void> {
  return fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  }).then(async (response) => {
    if (!response.ok) {
      const errorBody = await readErrorBody(response)
      throw new ApiError(response.status, errorBody.code, errorBody.message, errorBody.details)
    }
  })
}

/** Builds a query string, dropping empty/undefined values. */
export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}
