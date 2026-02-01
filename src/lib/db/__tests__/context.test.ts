/**
 * Row Level Security (RLS) Context Tests
 *
 * Tests for database context management functions that support RLS.
 * These tests verify that user context is properly set and retrieved
 * from PostgreSQL session variables.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  setUserIdContext,
  setUserRoleContext,
  setUserContext,
  clearUserContext,
  getCurrentUserId,
  getCurrentUserRole,
  withAdminBypass,
} from '../context'

// Mock pg Pool
class MockPool {
  queries: string[] = []
  connectReturnValue: MockClient | null = null

  async connect(): Promise<MockClient> {
    if (this.connectReturnValue) {
      return this.connectReturnValue
    }
    const client = new MockClient(this)
    await this.connect()
    return client
  }

  async query(sql: string): Promise<any> {
    this.queries.push(sql)
    return { rows: [] }
  }
}

class MockClient {
  queries: string[] = []
  released = false

  constructor(private pool: MockPool) {}

  async query(sql: string): Promise<any> {
    this.queries.push(sql)
    this.pool.queries.push(sql)

    // Mock current_setting responses
    if (sql.includes("current_setting('app.user_id'")) {
      return { rows: [{ user_id: 'test-user-id' }] }
    }
    if (sql.includes("current_setting('app.user_role'")) {
      return { rows: [{ user_role: 'admin' }] }
    }

    return { rows: [] }
  }

  release(): void {
    this.released = true
  }
}

describe('RLS Context Module', () => {
  let mockPool: MockPool
  let mockClient: MockClient

  beforeEach(() => {
    mockPool = new MockPool()
    mockClient = new MockClient(mockPool)
    mockPool.connectReturnValue = mockClient
  })

  describe('setUserIdContext', () => {
    it('sets user_id session variable', async () => {
      await setUserIdContext(mockPool, 'user-123')

      expect(mockPool.queries).toHaveLength(1)
      expect(mockPool.queries[0]).toContain("SET LOCAL app.user_id = 'user-123'")
    })

    it('handles pool with connect method', async () => {
      await setUserIdContext(mockPool, 'user-456')

      expect(mockClient.released).toBe(true)
    })

    it('handles direct client', async () => {
      await setUserIdContext(mockClient as any, 'user-789')

      expect(mockClient.queries).toHaveLength(1)
      expect(mockClient.queries[0]).toContain("SET LOCAL app.user_id = 'user-789'")
      expect(mockClient.released).toBe(false) // Direct client not released
    })
  })

  describe('setUserRoleContext', () => {
    it('sets user_role session variable', async () => {
      await setUserRoleContext(mockPool, 'admin')

      expect(mockPool.queries).toHaveLength(1)
      expect(mockPool.queries[0]).toContain("SET LOCAL app.user_role = 'admin'")
    })

    it('handles different roles', async () => {
      await setUserRoleContext(mockPool, 'service')
      expect(mockPool.queries[0]).toContain("'service'")

      mockPool.queries = []
      await setUserRoleContext(mockPool, 'user')
      expect(mockPool.queries[0]).toContain("'user'")
    })
  })

  describe('setUserContext', () => {
    it('sets both user_id and user_role', async () => {
      await setUserContext(mockPool, 'user-123', 'admin')

      expect(mockPool.queries).toHaveLength(2)
      expect(mockPool.queries[0]).toContain("SET LOCAL app.user_id = 'user-123'")
      expect(mockPool.queries[1]).toContain("SET LOCAL app.user_role = 'admin'")
    })

    it('defaults role to user if not provided', async () => {
      await setUserContext(mockPool, 'user-456')

      expect(mockPool.queries).toHaveLength(2)
      expect(mockPool.queries[1]).toContain("'user'")
    })
  })

  describe('clearUserContext', () => {
    it('clears both session variables', async () => {
      await clearUserContext(mockPool)

      expect(mockPool.queries).toHaveLength(2)
      expect(mockPool.queries[0]).toContain('SET LOCAL app.user_id = NULL')
      expect(mockPool.queries[1]).toContain('SET LOCAL app.user_role = NULL')
    })
  })

  describe('getCurrentUserId', () => {
    it('retrieves current user_id from session', async () => {
      const userId = await getCurrentUserId(mockPool)

      expect(userId).toBe('test-user-id')
      expect(mockPool.queries).toHaveLength(1)
      expect(mockPool.queries[0]).toContain("current_setting('app.user_id'")
    })

    it('returns null when no user_id is set', async () => {
      // Modify mock to return null
      mockClient.query = async () => ({ rows: [{}] })

      const userId = await getCurrentUserId(mockPool)

      expect(userId).toBeNull()
    })
  })

  describe('getCurrentUserRole', () => {
    it('retrieves current user_role from session', async () => {
      const role = await getCurrentUserRole(mockPool)

      expect(role).toBe('admin')
      expect(mockPool.queries).toHaveLength(1)
      expect(mockPool.queries[0]).toContain("current_setting('app.user_role'")
    })

    it('returns null when no user_role is set', async () => {
      // Modify mock to return null
      mockClient.query = async () => ({ rows: [{}] })

      const role = await getCurrentUserRole(mockPool)

      expect(role).toBeNull()
    })
  })

  describe('withAdminBypass', () => {
    it('executes callback with postgres role', async () => {
      let capturedClient: MockClient | null = null

      const result = await withAdminBypass(mockPool, async (client) => {
        capturedClient = client as any
        await client.query('SELECT * FROM users')
        return 'success'
      })

      expect(result).toBe('success')
      expect(mockPool.queries).toHaveLength(3)
      expect(mockPool.queries[0]).toContain('SET LOCAL ROLE postgres')
      expect(mockPool.queries[1]).toContain('SELECT * FROM users')
      expect(mockPool.queries[2]).toContain('RESET ROLE')
    })

    it('resets role after callback execution', async () => {
      await withAdminBypass(mockPool, async (client) => {
        return 'done'
      })

      expect(mockPool.queries).toHaveLength(2)
      expect(mockPool.queries[mockPool.queries.length - 1]).toContain('RESET ROLE')
    })

    it('releases client if using pool', async () => {
      await withAdminBypass(mockPool, async () => 'result')

      expect(mockClient.released).toBe(true)
    })

    it('handles errors in callback', async () => {
      await expect(
        withAdminBypass(mockPool, async () => {
          throw new Error('Test error')
        })
      ).rejects.toThrow('Test error')

      // Role should still be reset
      expect(mockPool.queries[mockPool.queries.length - 1]).toContain('RESET ROLE')
    })

    it('handles direct client without releasing', async () => {
      await withAdminBypass(mockClient as any, async () => 'result')

      expect(mockClient.released).toBe(false)
    })
  })
})
