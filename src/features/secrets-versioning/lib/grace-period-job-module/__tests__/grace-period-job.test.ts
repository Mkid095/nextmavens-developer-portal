/**
 * Grace Period Job Module Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  runGracePeriodCleanupJob,
  getGracePeriodStats,
} from '..'
import { getPool } from '@/lib/db'

// Mock getPool
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

describe('grace-period-job-module', () => {
  const mockPool = {
    query: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getPool).mockReturnValue(mockPool as any)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('runGracePeriodCleanupJob', () => {
    it('should delete expired secrets', async () => {
      // Mock expired secrets to be deleted
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'secret-1',
            project_id: 'proj-1',
            name: 'old-secret',
            version: 1,
            grace_period_ends_at: new Date('2026-01-01'),
          },
        ],
      })

      // Mock no expiring secrets
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      // Mock job execution log
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const result = await runGracePeriodCleanupJob()

      expect(result.deletedCount).toBe(1)
      expect(result.warningCount).toBe(0)
      expect(result.deletedSecrets).toHaveLength(1)
      expect(result.deletedSecrets[0]).toMatchObject({
        id: 'secret-1',
        name: 'old-secret',
        version: 1,
      })
      expect(result.error).toBeUndefined()
    })

    it('should send warnings for secrets expiring soon', async () => {
      // Mock no expired secrets
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      // Mock expiring secrets
      const expiringSecret = {
        id: 'secret-2',
        project_id: 'proj-1',
        name: 'expiring-secret',
        version: 1,
        grace_period_ends_at: new Date(Date.now() + 30 * 60 * 1000), // 30 mins from now
        project_name: 'Test Project',
        project_owner_email: 'test@example.com',
      }

      mockPool.query.mockResolvedValueOnce({ rows: [expiringSecret] })

      // Mock update for warning_sent_at and audit log
      mockPool.query.mockResolvedValueOnce({ rows: [] })
      mockPool.query.mockResolvedValueOnce({ rows: [] })
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const result = await runGracePeriodCleanupJob()

      expect(result.deletedCount).toBe(0)
      expect(result.warningCount).toBe(1)
      expect(result.warnedSecrets).toHaveLength(1)
      expect(result.warnedSecrets[0]).toMatchObject({
        id: 'secret-2',
        name: 'expiring-secret',
        version: 1,
      })
      expect(result.error).toBeUndefined()
    })

    it('should handle errors and return error message', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'))

      const result = await runGracePeriodCleanupJob()

      expect(result.deletedCount).toBe(0)
      expect(result.warningCount).toBe(0)
      expect(result.error).toBe('Database error')
    })

    it('should handle empty results', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // No expired secrets
        .mockResolvedValueOnce({ rows: [] }) // No expiring secrets
        .mockResolvedValueOnce({ rows: [] }) // Job log

      const result = await runGracePeriodCleanupJob()

      expect(result.deletedCount).toBe(0)
      expect(result.warningCount).toBe(0)
      expect(result.deletedSecrets).toHaveLength(0)
      expect(result.warnedSecrets).toHaveLength(0)
      expect(result.error).toBeUndefined()
    })
  })

  describe('getGracePeriodStats', () => {
    it('should return statistics about secrets in grace period', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // active
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // in grace period
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // expired
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }) // expiring soon

      const stats = await getGracePeriodStats()

      expect(stats).toEqual({
        activeSecrets: 10,
        inGracePeriod: 5,
        expired: 2,
        expiringSoon: 1,
      })
    })

    it('should parse count strings to integers', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '100' }] })
        .mockResolvedValueOnce({ rows: [{ count: '50' }] })
        .mockResolvedValueOnce({ rows: [{ count: '25' }] })
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })

      const stats = await getGracePeriodStats()

      expect(stats.activeSecrets).toBe(100)
      expect(stats.inGracePeriod).toBe(50)
      expect(stats.expired).toBe(25)
      expect(stats.expiringSoon).toBe(10)
    })

    it('should handle zero counts correctly', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })

      const stats = await getGracePeriodStats()

      expect(stats).toEqual({
        activeSecrets: 0,
        inGracePeriod: 0,
        expired: 0,
        expiringSoon: 0,
      })
    })
  })
})
