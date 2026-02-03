/**
 * Auth Usage Tracking Module Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  recordAuthMetric,
  recordAuthMetrics,
  trackAuthSignup,
  trackAuthSignin,
  getAuthUsageStats,
  getCurrentAuthUsage,
} from '..'
import { getPool } from '@/lib/db'

// Mock getPool
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

describe('auth-tracking-module', () => {
  const mockPool = {
    query: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getPool).mockReturnValue(mockPool as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validators', () => {
    it('should reject metric with missing projectId', async () => {
      console.error = vi.fn()

      await recordAuthMetric({
        projectId: '',
        metricType: 'auth_signup',
        quantity: 1,
      })

      expect(mockPool.query).not.toHaveBeenCalled()
    })

    it('should reject metric with invalid metricType', async () => {
      console.error = vi.fn()

      await recordAuthMetric({
        projectId: 'test-project',
        metricType: 'invalid_type' as any,
        quantity: 1,
      })

      expect(mockPool.query).not.toHaveBeenCalled()
    })

    it('should reject metric with negative quantity', async () => {
      console.error = vi.fn()

      await recordAuthMetric({
        projectId: 'test-project',
        metricType: 'auth_signup',
        quantity: -1,
      })

      expect(mockPool.query).not.toHaveBeenCalled()
    })

    it('should accept valid metric', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await recordAuthMetric({
        projectId: 'test-project',
        metricType: 'auth_signup',
        quantity: 1,
      })

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO control_plane.usage_metrics'),
        ['test-project', 'auth', 'auth_signup', 1]
      )
    })
  })

  describe('recordAuthMetric', () => {
    it('should record metric successfully', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await recordAuthMetric({
        projectId: 'test-project',
        metricType: 'auth_signin',
        quantity: 5,
      })

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO control_plane.usage_metrics'),
        ['test-project', 'auth', 'auth_signin', 5]
      )
    })

    it('should handle database errors gracefully', async () => {
      console.error = vi.fn()
      mockPool.query.mockRejectedValueOnce(new Error('Database error'))

      await recordAuthMetric({
        projectId: 'test-project',
        metricType: 'auth_signup',
        quantity: 1,
      })

      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('recordAuthMetrics', () => {
    it('should record multiple metrics in bulk', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await recordAuthMetrics([
        { projectId: 'test-project', metricType: 'auth_signup', quantity: 1 },
        { projectId: 'test-project', metricType: 'auth_signin', quantity: 2 },
      ])

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('VALUES'),
        expect.arrayContaining(['test-project', 'auth', 'auth_signup', 1, 'test-project', 'auth', 'auth_signin', 2])
      )
    })

    it('should handle empty metrics array', async () => {
      await recordAuthMetrics([])

      expect(mockPool.query).not.toHaveBeenCalled()
    })
  })

  describe('trackAuthSignup', () => {
    it('should track signup with default quantity of 1', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await trackAuthSignup('test-project')

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO control_plane.usage_metrics'),
        ['test-project', 'auth', 'auth_signup', 1]
      )
    })
  })

  describe('trackAuthSignin', () => {
    it('should track signin with default quantity of 1', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      await trackAuthSignin('test-project')

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO control_plane.usage_metrics'),
        ['test-project', 'auth', 'auth_signin', 1]
      )
    })
  })

  describe('getAuthUsageStats', () => {
    it('should return aggregated stats', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ auth_signup_count: '10', auth_signin_count: '20' }],
        })
        .mockResolvedValueOnce({
          rows: [
            { date: '2026-01-01', auth_signup_count: '5', auth_signin_count: '10' },
            { date: '2026-01-02', auth_signup_count: '5', auth_signin_count: '10' },
          ],
        })

      const result = await getAuthUsageStats('test-project')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        signupCount: 10,
        signinCount: 20,
        breakdownByDay: [
          { date: '2026-01-01', signupCount: 5, signinCount: 10 },
          { date: '2026-01-02', signupCount: 5, signinCount: 10 },
        ],
      })
    })

    it('should handle database errors', async () => {
      console.error = vi.fn()
      mockPool.query.mockRejectedValueOnce(new Error('Database error'))

      const result = await getAuthUsageStats('test-project')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })

    it('should use custom date range when provided', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ auth_signup_count: '5', auth_signin_count: '10' }],
        })
        .mockResolvedValueOnce({ rows: [] })

      const startDate = new Date('2026-01-01')
      const endDate = new Date('2026-01-31')

      await getAuthUsageStats('test-project', startDate, endDate)

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE project_id ='),
        ['test-project', 'auth', startDate, endDate]
      )
    })
  })

  describe('getCurrentAuthUsage', () => {
    it('should return current usage stats', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ auth_signup_count: '15', auth_signin_count: '25' }],
        })
        .mockResolvedValueOnce({ rows: [] })

      const result = await getCurrentAuthUsage('test-project')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        signupCount: 15,
        signinCount: 25,
      })
    })

    it('should return error when stats query fails', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'))

      const result = await getCurrentAuthUsage('test-project')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })
})
