/**
 * Dashboard Queries Module Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getSuspensionsStats,
  getRateLimitsStats,
  getCapViolationsStats,
  getApproachingCapsStats,
  getPatternsStats,
} from '..'
import { getPool } from '@/lib/db'

// Mock getPool
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

describe('dashboard-queries-module', () => {
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

  describe('getSuspensionsStats', () => {
    it('should return suspension statistics', async () => {
      const startTime = new Date('2026-01-01')
      const endTime = new Date('2026-01-31')

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // total
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // active
        .mockResolvedValueOnce({
          rows: [
            { cap_exceeded: 'DB_QUERIES_PER_DAY', count: '3' },
            { cap_exceeded: 'STORAGE_GB', count: '2' },
          ],
        })

      const result = await getSuspensionsStats(startTime, endTime)

      expect(result).toEqual({
        total: 5,
        active: 2,
        by_type: {
          DB_QUERIES_PER_DAY: 3,
          STORAGE_GB: 2,
        },
      })
    })

    it('should handle errors and return empty stats', async () => {
      console.error = vi.fn()
      mockPool.query.mockRejectedValueOnce(new Error('Database error'))

      const result = await getSuspensionsStats(new Date(), new Date())

      expect(result).toEqual({
        total: 0,
        active: 0,
        by_type: {},
      })
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('getRateLimitsStats', () => {
    it('should return rate limit statistics', async () => {
      const startTime = new Date('2026-01-01')
      const endTime = new Date('2026-01-31')

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '100' }] }) // total
        .mockResolvedValueOnce({
          rows: [
            { identifier_type: 'ip', count: '60' },
            { identifier_type: 'api_key', count: '40' },
          ],
        })

      const result = await getRateLimitsStats(startTime, endTime)

      expect(result).toEqual({
        total: 100,
        by_type: {
          ip: 60,
          api_key: 40,
        },
      })
    })

    it('should handle errors and return empty stats', async () => {
      console.error = vi.fn()
      mockPool.query.mockRejectedValueOnce(new Error('Database error'))

      const result = await getRateLimitsStats(new Date(), new Date())

      expect(result).toEqual({
        total: 0,
        by_type: {},
      })
    })
  })

  describe('getCapViolationsStats', () => {
    it('should return cap violations with project details', async () => {
      const startTime = new Date('2026-01-01')
      const endTime = new Date('2026-01-31')

      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            project_id: 'proj-1',
            project_name: 'Test Project',
            organization: 'Test Org',
            cap_exceeded: 'DB_QUERIES_PER_DAY',
            reason: 'Exceeded daily query limit',
            suspended_at: new Date('2026-01-15'),
          },
        ],
      })

      const result = await getCapViolationsStats(startTime, endTime)

      expect(result.total).toBe(1)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0]).toMatchObject({
        project_id: 'proj-1',
        project_name: 'Test Project',
        organization: 'Test Org',
        cap_exceeded: 'DB_QUERIES_PER_DAY',
      })
    })

    it('should handle errors and return empty violations', async () => {
      console.error = vi.fn()
      mockPool.query.mockRejectedValueOnce(new Error('Database error'))

      const result = await getCapViolationsStats(new Date(), new Date())

      expect(result).toEqual({
        total: 0,
        violations: [],
      })
    })
  })

  describe('getApproachingCapsStats', () => {
    it('should return projects approaching their caps', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            project_id: 'proj-1',
            project_name: 'Test Project',
            organization: 'Test Org',
            cap_type: 'DB_QUERIES_PER_DAY',
            cap_value: '10000',
            current_usage: '0',
            usage_percentage: '0',
          },
        ],
      })

      const result = await getApproachingCapsStats()

      expect(result.total).toBe(1)
      expect(result.projects).toHaveLength(1)
      expect(result.projects[0]).toMatchObject({
        project_id: 'proj-1',
        project_name: 'Test Project',
        cap_type: 'DB_QUERIES_PER_DAY',
        cap_value: 10000,
        current_usage: 0,
        usage_percentage: 0,
      })
    })

    it('should handle parsing of numeric values', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            project_id: 'proj-1',
            project_name: 'Test Project',
            organization: 'Test Org',
            cap_type: 'DB_QUERIES_PER_DAY',
            cap_value: '10000',
            current_usage: '8500',
            usage_percentage: '85.5',
          },
        ],
      })

      const result = await getApproachingCapsStats()

      expect(result.projects[0].cap_value).toBe(10000)
      expect(result.projects[0].current_usage).toBe(8500)
      expect(result.projects[0].usage_percentage).toBe(85.5)
    })

    it('should handle errors and return empty projects', async () => {
      console.error = vi.fn()
      mockPool.query.mockRejectedValueOnce(new Error('Database error'))

      const result = await getApproachingCapsStats()

      expect(result).toEqual({
        total: 0,
        projects: [],
      })
    })
  })

  describe('getPatternsStats', () => {
    it('should return pattern detection statistics', async () => {
      const startTime = new Date('2026-01-01')
      const endTime = new Date('2026-01-31')

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '25' }] }) // total
        .mockResolvedValueOnce({
          rows: [
            { pattern_type: 'rate_limit_surge', count: '15' },
            { pattern_type: 'unusual_user_agent', count: '10' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { severity: 'high', count: '5' },
            { severity: 'medium', count: '20' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              project_id: 'proj-1',
              project_name: 'Test Project',
              organization: 'Test Org',
              pattern_type: 'rate_limit_surge',
              severity: 'high',
              occurrence_count: '50',
              description: 'Unusual spike in API calls',
              detected_at: new Date('2026-01-15'),
            },
          ],
        })

      const result = await getPatternsStats(startTime, endTime)

      expect(result).toEqual({
        total: 25,
        by_type: {
          rate_limit_surge: 15,
          unusual_user_agent: 10,
        },
        by_severity: {
          high: 5,
          medium: 20,
        },
        recent: [
          {
            project_id: 'proj-1',
            project_name: 'Test Project',
            organization: 'Test Org',
            pattern_type: 'rate_limit_surge',
            severity: 'high',
            occurrence_count: 50,
            description: 'Unusual spike in API calls',
            detected_at: new Date('2026-01-15'),
          },
        ],
      })
    })

    it('should handle errors and return empty pattern stats', async () => {
      console.error = vi.fn()
      mockPool.query.mockRejectedValueOnce(new Error('Database error'))

      const result = await getPatternsStats(new Date(), new Date())

      expect(result).toEqual({
        total: 0,
        by_type: {},
        by_severity: {},
        recent: [],
      })
    })
  })
})
