/**
 * Test Setup and Fixtures for Provisioning Handler Tests
 *
 * Provides shared mocks, fixtures, and test utilities
 */

import { vi, beforeEach, afterEach } from 'vitest'
import type { Pool } from 'pg'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  generateApiKey: vi.fn((type: string) => {
    if (type === 'public') return 'a'.repeat(64)
    if (type === 'secret') return 'b'.repeat(64)
    return 'c'.repeat(64)
  }),
  hashApiKey: vi.fn((key: string) => `hash_${key.substring(0, 10)}`),
  generateAccessToken: vi.fn(),
  verifyAccessToken: vi.fn(),
  authenticateRequest: vi.fn(),
  checkProjectStatus: vi.fn(),
  authenticateApiKey: vi.fn(),
  logApiKeyUsage: vi.fn(),
  updateKeyUsage: vi.fn(),
  generateSlug: vi.fn(),
}))

// Mock fetch globally for service registration tests
global.fetch = vi.fn()

/**
 * Mock pool client
 */
export const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
}

/**
 * Mock pool
 */
export const mockPool = {
  connect: vi.fn(),
} as unknown as Pool

/**
 * Test fixture for a valid project
 */
export const validProjectFixture = {
  id: 'test-project-id',
  name: 'Test Project',
  slug: 'test-project',
  tenant_id: 'tenant-123',
  environment: 'dev' as const,
  developer_id: 'dev-456',
}

/**
 * Test fixture for auth service response
 */
export const authServiceResponseFixture = {
  tenant: { id: 'auth-tenant-123', slug: 'test-project' },
  user: { id: 'user-123', email: 'admin@test-project.placeholder' },
}

/**
 * Test fixture for realtime service response
 */
export const realtimeServiceResponseFixture = {
  status: 'ok',
  service: 'realtime-service',
}

/**
 * Common setup function for all tests
 */
export function setupCommonTestEnvironment() {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockReset()

    // Setup environment variables
    vi.stubEnv('AUTH_SERVICE_URL', 'http://localhost:3001')
    vi.stubEnv('TELEGRAM_STORAGE_API_URL', 'https://telegram-api.test.com')
    vi.stubEnv('TELEGRAM_STORAGE_API_KEY', 'test-key')
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'test-cloud')

    // Setup mock pool
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })
}

/**
 * Setup function for tests without environment variables
 */
export function setupBasicTestEnvironment() {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockPool.connect).mockResolvedValue(mockClient as any)
  })
}
