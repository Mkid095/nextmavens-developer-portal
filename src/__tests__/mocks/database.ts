/**
 * Database Mock Utilities
 *
 * Provides mock implementations for PostgreSQL pool and queries
 */

import { vi } from 'vitest'

export interface MockQueryResult {
  rows: unknown[]
  rowCount?: number
}

export class MockPool {
  private queries: Map<string, MockQueryResult> = new Map()
  private queryHistory: Array<{ query: string; params: unknown[] }> = []

  /**
   * Set a mock query result
   */
  setMockResult(query: string, result: MockQueryResult): void {
    this.queries.set(query, result)
  }

  /**
   * Mock query method
   */
  query = vi.fn(async (text: string, params?: unknown[]): Promise<MockQueryResult> => {
    // Record query history
    this.queryHistory.push({ query: text, params: params || [] })

    // Return mock result if available
    for (const [key, value] of this.queries.entries()) {
      if (text.includes(key)) {
        return value
      }
    }

    // Default empty result
    return { rows: [] }
  })

  /**
   * Get query history for assertions
   */
  getQueryHistory(): Array<{ query: string; params: unknown[] }> {
    return this.queryHistory
  }

  /**
   * Clear query history
   */
  clearHistory(): void {
    this.queryHistory = []
    this.queries.clear()
  }

  /**
   * Verify a query was called
   */
  verifyQueryCalled(query: string, times?: number): boolean {
    const calls = this.queryHistory.filter(h => h.query.includes(query))
    if (times === undefined) {
      return calls.length > 0
    }
    return calls.length === times
  }
}

/**
 * Create a mock pool with default results
 */
export function createMockPool(): MockPool {
  return new MockPool()
}

/**
 * Setup mock pool with common test data
 */
export function setupMockPool(): MockPool {
  const pool = createMockPool()

  // Default mock results for common queries
  pool.setMockResult('SELECT * FROM developers WHERE email', {
    rows: [
      {
        id: 'test-dev-id',
        email: 'test@example.com',
        password_hash: 'hashed_testpassword',
        name: 'Test Developer',
        organization: 'Test Org',
        status: 'active',
        created_at: new Date(),
      },
    ],
  })

  pool.setMockResult('SELECT id FROM developers WHERE email', {
    rows: [],
  })

  pool.setMockResult('SELECT * FROM projects WHERE id', {
    rows: [
      {
        id: 'test-project-id',
        developer_id: 'test-dev-id',
        name: 'Test Project',
        slug: 'test-project',
        status: 'active',
        created_at: new Date(),
      },
    ],
  })

  pool.setMockResult('SELECT id FROM projects WHERE id AND developer_id', {
    rows: [
      {
        id: 'test-project-id',
      },
    ],
  })

  return pool
}
