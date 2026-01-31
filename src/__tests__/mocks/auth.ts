/**
 * Authentication Mock Utilities
 *
 * Provides mock implementations for authentication functions
 */

import { vi } from 'vitest'
import type { Developer, JwtPayload } from '@/lib/auth'

export const mockDevelopers: Record<string, Developer> = {
  testDeveloper: {
    id: 'test-dev-id',
    email: 'test@example.com',
    name: 'Test Developer',
    organization: 'Test Org',
  },
}

export const mockProjects: Record<string, { id: string; developer_id: string; name: string; slug: string; status: string }> = {
  testProject: {
    id: 'test-project-id',
    developer_id: 'test-dev-id',
    name: 'Test Project',
    slug: 'test-project',
    status: 'active',
  },
}

export const mockApiKeys: Record<string, {
  id: string
  project_id: string
  developer_id: string
  key_type: string
  key_prefix: string
  scopes: string[]
  environment: string
  name: string
  status: string
}> = {
  testPublicKey: {
    id: 'test-key-id',
    project_id: 'test-project-id',
    developer_id: 'test-dev-id',
    key_type: 'public',
    key_prefix: 'nm_live_pk',
    scopes: ['read:projects', 'read:api_keys'],
    environment: 'live',
    name: 'Test Public Key',
    status: 'active',
  },
}

/**
 * Create a mock JWT payload
 */
export function createMockJwtPayload(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    id: 'test-dev-id',
    email: 'test@example.com',
    project_id: 'test-project-id',
    ...overrides,
  }
}

/**
 * Create a mock access token
 */
export function createMockAccessToken(overrides: Partial<JwtPayload> = {}): string {
  const payload = createMockJwtPayload(overrides)
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

/**
 * Mock NextRequest with authorization header
 */
export function createMockAuthRequest(overrides: {
  token?: string
  headers?: Record<string, string>
  body?: unknown
} = {}): Request {
  const token = overrides.token || createMockAccessToken()

  const headers = new Headers()
  headers.set('authorization', `Bearer ${token}`)
  headers.set('content-type', 'application/json')

  // Add additional headers
  if (overrides.headers) {
    Object.entries(overrides.headers).forEach(([key, value]) => {
      headers.set(key, value)
    })
  }

  return {
    headers,
    json: async () => overrides.body as Record<string, unknown>,
    text: async () => JSON.stringify(overrides.body),
    // @ts-expect-error - partial mock
    clone: () => ({ headers, json: async () => overrides.body }),
  } as unknown as Request
}

/**
 * Mock NextRequest with API key
 */
export function createMockApiKeyRequest(apiKey: string, overrides: {
  headers?: Record<string, string>
  body?: unknown
} = {}): Request {
  const headers = new Headers()
  headers.set('x-api-key', apiKey)
  headers.set('content-type', 'application/json')

  if (overrides.headers) {
    Object.entries(overrides.headers).forEach(([key, value]) => {
      headers.set(key, value)
    })
  }

  return {
    headers,
    json: async () => overrides.body as Record<string, unknown>,
    text: async () => JSON.stringify(overrides.body),
    // @ts-expect-error - partial mock
    clone: () => ({ headers, json: async () => overrides.body }),
  } as unknown as Request
}

/**
 * Mock authenticated developer response
 */
export function createMockDeveloperResponse(overrides: Partial<Developer> = {}) {
  return {
    id: 'test-dev-id',
    email: 'test@example.com',
    name: 'Test Developer',
    organization: 'Test Org',
    ...overrides,
  }
}

/**
 * Mock JWT verification
 */
export const mockVerifyAccessToken = vi.fn((token: string) => {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    return decoded as JwtPayload
  } catch {
    throw new Error('Invalid token')
  }
})

/**
 * Mock JWT generation
 */
export const mockGenerateAccessToken = vi.fn((developer: Developer, projectId: string) => {
  const payload: JwtPayload = {
    id: developer.id,
    email: developer.email,
    project_id: projectId,
  }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
})

/**
 * Mock JWT refresh token generation
 */
export const mockGenerateRefreshToken = vi.fn((developerId: string) => {
  return `refresh_${developerId}_${Date.now()}`
})
