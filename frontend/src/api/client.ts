import type { components } from './schema'

// Types come from the backend's OpenAPI schema (`npm run gen:api`), never written by hand.
export type HealthResponse = components['schemas']['HealthResponse']
export type Taxonomy = components['schemas']['Taxonomy']

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: 'include' })
  if (!response.ok) {
    throw new ApiError(response.status, `${path} returned ${response.status}`)
  }
  return (await response.json()) as T
}

export const api = {
  health: () => getJson<HealthResponse>('/api/health'),
  // The browser caches it (Cache-Control + ETag), so the search bar filters locally.
  occupations: () => getJson<Taxonomy>('/api/occupations'),
}
