/**
 * Vitest Mock Setup
 *
 * Mock database pool for all storage tests.
 */

import { vi } from 'vitest'

// Mock database pool
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(() => ({
    query: vi.fn(),
  })),
}))

export const mockQuery = vi.fn()
export const mockPool = { query: mockQuery }

export function setupMockPool() {
  vi.clearAllMocks()
  const { getPool } = require('@/lib/db')
  getPool.mockReturnValue(mockPool)
}

export function getPoolMock() {
  return require('@/lib/db').getPool()
}
