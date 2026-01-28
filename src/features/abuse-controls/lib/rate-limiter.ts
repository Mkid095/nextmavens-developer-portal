/**
 * Rate Limiter Library
 * Implements PostgreSQL-based rate limiting for signup and other operations
 */

import { getPool } from '@/lib/db'
import {
  RateLimitIdentifier,
  RateLimitIdentifierType,
  RateLimitResult,
  RateLimitError,
} from '@/features/abuse-controls/types'

// Re-export types and enum for convenience
export type { RateLimitIdentifier, RateLimitResult, RateLimitError }
export { RateLimitIdentifierType }

/**
 * Check if rate limit is exceeded for a given identifier
 *
 * @param identifier - Rate limit identifier (org or IP)
 * @param limit - Maximum number of attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result with allowed status and metadata
 */
export async function checkRateLimit(
  identifier: RateLimitIdentifier,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const pool = getPool()
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMs)

  try {
    // Clean up old records outside the window
    await pool.query(
      `DELETE FROM rate_limits
       WHERE window_start < $1`,
      [windowStart]
    )

    // Get or create rate limit record for this identifier
    const result = await pool.query(
      `INSERT INTO rate_limits (identifier_type, identifier_value, attempt_count, window_start, updated_at)
       VALUES ($1, $2, 1, $3, $4)
       ON CONFLICT (identifier_type, identifier_value, window_start)
       DO UPDATE SET
         attempt_count = rate_limits.attempt_count + 1,
         updated_at = $4
       RETURNING attempt_count, window_start`,
      [identifier.type, identifier.value, now, now]
    )

    const record = result.rows[0]
    const remainingAttempts = Math.max(0, limit - record.attempt_count)
    const resetAt = new Date(record.window_start.getTime() + windowMs)

    return {
      allowed: record.attempt_count <= limit,
      remainingAttempts,
      resetAt,
    }
  } catch (error) {
    console.error('[Rate Limiter] Error checking rate limit:', error)
    // Fail open - allow the request if rate limiting fails
    return {
      allowed: true,
      remainingAttempts: limit,
      resetAt: new Date(Date.now() + windowMs),
    }
  }
}

/**
 * Record a rate limit attempt (increment counter)
 *
 * @param identifier - Rate limit identifier (org or IP)
 * @returns Current attempt count
 */
export async function recordRateLimitAttempt(
  identifier: RateLimitIdentifier
): Promise<number> {
  const pool = getPool()
  const now = new Date()

  try {
    const result = await pool.query(
      `INSERT INTO rate_limits (identifier_type, identifier_value, attempt_count, window_start, updated_at)
       VALUES ($1, $2, 1, $3, $4)
       ON CONFLICT (identifier_type, identifier_value, window_start)
       DO UPDATE SET
         attempt_count = rate_limits.attempt_count + 1,
         updated_at = $4
       RETURNING attempt_count`,
      [identifier.type, identifier.value, now, now]
    )

    return result.rows[0].attempt_count
  } catch (error) {
    console.error('[Rate Limiter] Error recording attempt:', error)
    return 0
  }
}

/**
 * Get retry-after seconds for a rate-limited identifier
 *
 * @param identifier - Rate limit identifier (org or IP)
 * @param windowMs - Time window in milliseconds
 * @returns Seconds until retry is allowed, or 0 if not rate limited
 */
export async function getRetryAfterSeconds(
  identifier: RateLimitIdentifier,
  windowMs: number
): Promise<number> {
  const pool = getPool()
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMs)

  try {
    const result = await pool.query(
      `SELECT window_start
       FROM rate_limits
       WHERE identifier_type = $1
         AND identifier_value = $2
         AND window_start >= $3
       ORDER BY window_start DESC
       LIMIT 1`,
      [identifier.type, identifier.value, windowStart]
    )

    if (result.rows.length === 0) {
      return 0
    }

    const resetAt = new Date(result.rows[0].window_start.getTime() + windowMs)
    const retryAfterMs = resetAt.getTime() - now.getTime()

    return Math.max(0, Math.ceil(retryAfterMs / 1000))
  } catch (error) {
    console.error('[Rate Limiter] Error getting retry-after:', error)
    return 0
  }
}

/**
 * Create a rate limit error object
 *
 * @param identifier - Rate limit identifier
 * @param limit - Maximum number of attempts
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit error with retry information
 */
export function createRateLimitError(
  identifier: RateLimitIdentifier,
  limit: number,
  windowMs: number
): RateLimitError {
  const now = new Date()
  const resetAt = new Date(now.getTime() + windowMs)
  const retryAfterSeconds = Math.ceil(windowMs / 1000)

  return {
    identifier,
    limit,
    windowMs,
    retryAfterSeconds,
    resetAt,
  }
}

/**
 * Extract client IP from request headers
 *
 * @param req - NextRequest object
 * @returns Client IP address
 */
export function extractClientIP(req: Request): string {
  // Try x-forwarded-for header first (for proxied requests)
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, use the first one
    return forwardedFor.split(',')[0].trim()
  }

  // Try cf-connecting-ip header (Cloudflare)
  const cfIP = req.headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }

  // Try x-real-ip header (Nginx)
  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to a default
  return '0.0.0.0'
}
