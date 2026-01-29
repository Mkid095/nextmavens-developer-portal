import { getPool } from '@/lib/db'

/**
 * Idempotency Middleware
 *
 * Provides idempotency support for API operations to prevent duplicate
 * requests from causing duplicate side effects.
 *
 * US-002: Create Idempotency Middleware
 */

/**
 * Cached response stored in the idempotency keys table
 */
export interface IdempotencyResponse {
  status: number
  headers: Record<string, string>
  body: unknown
}

/**
 * Result from an idempotency check
 */
export interface IdempotencyResult {
  isDuplicate: boolean
  cachedResponse: IdempotencyResponse | null
}

/**
 * Options for idempotency operations
 */
export interface IdempotencyOptions {
  /**
   * Time-to-live for the idempotency key (in seconds)
   * Default: 3600 (1 hour)
   */
  ttl?: number
}

/**
 * Check if an idempotency key exists and return the cached response
 *
 * @param key - The idempotency key to check
 * @returns Result indicating if this is a duplicate request
 */
export async function checkIdempotencyKey(
  key: string
): Promise<IdempotencyResult> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `SELECT response
       FROM control_plane.idempotency_keys
       WHERE key = $1
         AND expires_at > NOW()`,
      [key]
    )

    if (result.rows.length > 0) {
      return {
        isDuplicate: true,
        cachedResponse: result.rows[0].response as IdempotencyResponse,
      }
    }

    return {
      isDuplicate: false,
      cachedResponse: null,
    }
  } catch (error) {
    console.error('[Idempotency] Error checking key:', error)
    // On error, allow the request to proceed (fail-open)
    return {
      isDuplicate: false,
      cachedResponse: null,
    }
  }
}

/**
 * Store an operation result in the idempotency keys table
 *
 * @param key - The idempotency key
 * @param response - The response to cache
 * @param options - Optional configuration
 * @param options.ttl - Time-to-live in seconds (default: 3600)
 */
export async function storeIdempotencyResult(
  key: string,
  response: IdempotencyResponse,
  options: IdempotencyOptions = {}
): Promise<void> {
  const pool = getPool()
  const ttl = options.ttl ?? 3600 // Default 1 hour

  try {
    await pool.query(
      `INSERT INTO control_plane.idempotency_keys (key, response, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 second' * $3)
       ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(response), ttl]
    )
  } catch (error) {
    console.error('[Idempotency] Error storing result:', error)
    // Don't throw - storage failure shouldn't break the operation
  }
}

/**
 * Wrapper function to add idempotency to any operation
 *
 * This helper checks for an existing cached response and returns it if found.
 * Otherwise, it executes the provided function and stores the result.
 *
 * @param key - The idempotency key
 * @param fn - The async function to execute if no cached result exists
 * @param options - Optional configuration
 * @returns The result (either cached or freshly computed)
 *
 * @example
 * ```ts
 * const result = await withIdempotency('create-user:123', async () => {
 *   return await createUser(data)
 * }, { ttl: 300 })
 * ```
 */
export async function withIdempotency<T extends IdempotencyResponse>(
  key: string,
  fn: () => Promise<T>,
  options: IdempotencyOptions = {}
): Promise<T> {
  // Check for existing response
  const existing = await checkIdempotencyKey(key)

  if (existing.isDuplicate && existing.cachedResponse) {
    return existing.cachedResponse as T
  }

  // Execute the function
  const result = await fn()

  // Store the result
  await storeIdempotencyResult(key, result, options)

  return result
}

/**
 * Extract or generate an idempotency key from a request
 *
 * If the Idempotency-Key header is present, use it.
 * Otherwise, generate a UUID-based key with the given prefix.
 *
 * @param prefix - Key prefix (e.g., 'provision', 'create_key')
 * @param requestHeaders - Headers object with get() method
 * @returns The idempotency key to use
 */
export function getIdempotencyKey(
  prefix: string,
  requestHeaders: { get: (name: string) => string | null },
  fallbackId?: string
): string {
  const headerKey = requestHeaders.get('Idempotency-Key')

  if (headerKey) {
    return `${prefix}:${headerKey}`
  }

  // Generate a key with the provided fallback or random UUID
  const suffix = fallbackId || crypto.randomUUID()
  return `${prefix}:${suffix}`
}
