/**
 * Tests for rate limiter
 *
 * Tests rate limiting logic, IP extraction, and retry-after calculation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkRateLimit,
  extractClientIP,
  getRetryAfterSeconds,
  createRateLimitError,
  recordRateLimitAttempt,
  RateLimitIdentifierType,
} from '../rate-limiter'
import { getPool } from '@/lib/db'

// Mock database
vi.mock('@/lib/db', () => ({
  getPool: vi.fn(),
}))

describe('Rate Limiter', () => {
  const mockPool = {
    query: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getPool).mockReturnValue(mockPool as never)
  })

  describe('checkRateLimit', () => {
    it('should allow requests under the limit', async () => {
      const windowDate = new Date()
      // First query: DELETE (doesn't return meaningful rows)
      mockPool.query.mockResolvedValueOnce({ rows: [] })
      // Second query: UPSERT returns the record
      mockPool.query.mockResolvedValueOnce({
        rows: [{ attempt_count: 1, window_start: windowDate }],
      })

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      const result = await checkRateLimit(identifier, 5, 3600000)

      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(4)
    })

    it('should block requests over the limit', async () => {
      const windowDate = new Date()
      // First query: DELETE
      mockPool.query.mockResolvedValueOnce({ rows: [] })
      // Second query: UPSERT returns record over limit
      mockPool.query.mockResolvedValueOnce({
        rows: [{ attempt_count: 6, window_start: windowDate }],
      })

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      const result = await checkRateLimit(identifier, 5, 3600000)

      expect(result.allowed).toBe(false)
      expect(result.remainingAttempts).toBe(0)
    })

    it('should clean up old records', async () => {
      const windowDate = new Date()
      mockPool.query.mockResolvedValueOnce({ rows: [] })
      mockPool.query.mockResolvedValueOnce({
        rows: [{ attempt_count: 1, window_start: windowDate }],
      })

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      await checkRateLimit(identifier, 5, 3600000)

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM rate_limits'),
        expect.any(Array)
      )
    })

    it('should use upsert pattern for rate limit records', async () => {
      const windowDate = new Date()
      mockPool.query.mockResolvedValueOnce({ rows: [] })
      mockPool.query.mockResolvedValueOnce({
        rows: [{ attempt_count: 1, window_start: windowDate }],
      })

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      await checkRateLimit(identifier, 5, 3600000)

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rate_limits'),
        expect.any(Array)
      )
    })

    it('should calculate correct reset time', async () => {
      const windowStart = new Date('2024-01-01T00:00:00Z')
      mockPool.query.mockResolvedValueOnce({ rows: [] })
      mockPool.query.mockResolvedValueOnce({
        rows: [{ attempt_count: 1, window_start: windowStart }],
      })

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      const windowMs = 3600000 // 1 hour
      const result = await checkRateLimit(identifier, 5, windowMs)

      const expectedReset = new Date(windowStart.getTime() + windowMs)
      expect(result.resetAt.getTime()).toBe(expectedReset.getTime())
    })

    it('should fail open on database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'))

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      const result = await checkRateLimit(identifier, 5, 3600000)

      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(5)
    })
  })

  describe('extractClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = {
        headers: new Headers({
          'x-forwarded-for': '203.0.113.1, 70.41.3.18, 150.172.238.178',
        }),
      } as Request

      const ip = extractClientIP(request)

      expect(ip).toBe('203.0.113.1')
    })

    it('should extract IP from cf-connecting-ip header (Cloudflare)', () => {
      const request = {
        headers: new Headers({
          'cf-connecting-ip': '198.51.100.1',
        }),
      } as Request

      const ip = extractClientIP(request)

      expect(ip).toBe('198.51.100.1')
    })

    it('should extract IP from x-real-ip header (Nginx)', () => {
      const request = {
        headers: new Headers({
          'x-real-ip': '192.0.2.1',
        }),
      } as Request

      const ip = extractClientIP(request)

      expect(ip).toBe('192.0.2.1')
    })

    it('should prioritize headers in correct order', () => {
      const request = {
        headers: new Headers({
          'cf-connecting-ip': '198.51.100.1',
          'x-forwarded-for': '203.0.113.1',
          'x-real-ip': '192.0.2.1',
        }),
      } as Request

      const ip = extractClientIP(request)

      // x-forwarded-for has priority
      expect(ip).toBe('203.0.113.1')
    })

    it('should return fallback IP when no headers present', () => {
      const request = {
        headers: new Headers(),
      } as Request

      const ip = extractClientIP(request)

      expect(ip).toBe('0.0.0.0')
    })

    it('should trim whitespace from x-forwarded-for', () => {
      const request = {
        headers: new Headers({
          'x-forwarded-for': '  203.0.113.1  ',
        }),
      } as Request

      const ip = extractClientIP(request)

      expect(ip).toBe('203.0.113.1')
    })
  })

  describe('getRetryAfterSeconds', () => {
    it('should return 0 when no rate limit record exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] })

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      const retryAfter = await getRetryAfterSeconds(identifier, 3600000)

      expect(retryAfter).toBe(0)
    })

    it('should calculate retry-after seconds correctly', async () => {
      const windowStart = new Date(Date.now() - 1800000) // 30 minutes ago
      const windowMs = 3600000 // 1 hour window

      mockPool.query.mockResolvedValueOnce({
        rows: [{ window_start: windowStart }],
      })

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      const retryAfter = await getRetryAfterSeconds(identifier, windowMs)

      // Should be approximately 1800 seconds (30 minutes)
      expect(retryAfter).toBeGreaterThan(1700)
      expect(retryAfter).toBeLessThan(1900)
    })

    it('should return 0 when window has expired', async () => {
      const windowStart = new Date(Date.now() - 7200000) // 2 hours ago
      const windowMs = 3600000 // 1 hour window

      mockPool.query.mockResolvedValueOnce({
        rows: [{ window_start: windowStart }],
      })

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      const retryAfter = await getRetryAfterSeconds(identifier, windowMs)

      expect(retryAfter).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'))

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      const retryAfter = await getRetryAfterSeconds(identifier, 3600000)

      expect(retryAfter).toBe(0)
    })
  })

  describe('createRateLimitError', () => {
    it('should create rate limit error with correct properties', () => {
      const identifier = {
        type: RateLimitIdentifierType.ORG,
        value: 'test-org',
      }
      const limit = 10
      const windowMs = 3600000

      const error = createRateLimitError(identifier, limit, windowMs)

      expect(error.identifier).toEqual(identifier)
      expect(error.limit).toBe(limit)
      expect(error.windowMs).toBe(windowMs)
      expect(error.retryAfterSeconds).toBe(3600)
      expect(error.resetAt).toBeInstanceOf(Date)
    })
  })

  describe('recordRateLimitAttempt', () => {
    it('should record attempt and return count', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ attempt_count: 1 }],
      })

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      const count = await recordRateLimitAttempt(identifier)

      expect(count).toBe(1)
    })

    it('should increment count on subsequent attempts', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ attempt_count: 2 }],
      })

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      const count = await recordRateLimitAttempt(identifier)

      expect(count).toBe(2)
    })

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'))

      const identifier = {
        type: RateLimitIdentifierType.IP,
        value: '127.0.0.1',
      }

      const count = await recordRateLimitAttempt(identifier)

      expect(count).toBe(0)
    })
  })

  describe('RateLimitIdentifierType', () => {
    it('should have IP type', () => {
      expect(RateLimitIdentifierType.IP).toBe('ip')
    })

    it('should have ORG type', () => {
      expect(RateLimitIdentifierType.ORG).toBe('org')
    })
  })
})
