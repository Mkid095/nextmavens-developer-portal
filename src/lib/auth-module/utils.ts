/**
 * Authentication Library - Utility Functions
 */

import crypto from 'crypto'

/**
 * Generate a URL slug from a name
 * @param name - The name to convert to a slug
 * @returns A URL-safe slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

/**
 * Generate an API key with the specified format.
 * US-010: Environment-Specific API Key Prefixes
 * Format: {prefix}_{random_bytes}
 * Example: nm_live_pk_abc123def456...
 *
 * Note: This function generates the random suffix only.
 * Use getKeyPrefix() to get the environment-specific prefix.
 *
 * @param type - The type of API key (public or secret)
 * @returns The random suffix of the API key
 */
export function generateApiKey(type: 'public' | 'secret' = 'public'): string {
  const key = Buffer.from(crypto.randomBytes(32)).toString('hex')
  return key
}

/**
 * Hash an API key using SHA-256
 * @param key - The API key to hash
 * @returns The hex-encoded hash of the key
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}
