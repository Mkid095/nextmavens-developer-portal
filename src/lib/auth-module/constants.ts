/**
 * Authentication Library - Constants
 */

const JWT_SECRET = process.env.JWT_SECRET
const REFRESH_SECRET = process.env.REFRESH_SECRET

/**
 * Get JWT secret from environment
 * Returns a placeholder during build time if not set
 */
export function getJwtSecret(): string {
  return JWT_SECRET || 'change-this-in-production'
}

/**
 * Get refresh token secret from environment
 * Returns a placeholder during build time if not set
 */
export function getRefreshSecret(): string {
  return REFRESH_SECRET || 'change-this-in-production'
}

/**
 * Token expiration times
 */
export const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: '1h',
  REFRESH_TOKEN: '7d',
} as const
