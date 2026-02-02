/**
 * Authentication Library - Constants
 */

const JWT_SECRET = process.env.JWT_SECRET
const REFRESH_SECRET = process.env.REFRESH_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

if (!REFRESH_SECRET) {
  throw new Error('REFRESH_SECRET environment variable is required')
}

/**
 * Get JWT secret from environment
 * @throws Error if JWT_SECRET is not set
 */
export function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return JWT_SECRET
}

/**
 * Get refresh token secret from environment
 * @throws Error if REFRESH_SECRET is not set
 */
export function getRefreshSecret(): string {
  if (!REFRESH_SECRET) {
    throw new Error('REFRESH_SECRET environment variable is required')
  }
  return REFRESH_SECRET
}

/**
 * Token expiration times
 */
export const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: '1h',
  REFRESH_TOKEN: '7d',
} as const
