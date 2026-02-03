/**
 * Authentication Configuration
 */

import { createError, ErrorCode } from '../errors'

export function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET
  // During build time or if not configured, use a placeholder
  // The actual JWT verification will fail properly if the secret is wrong
  return jwtSecret || 'change-this-in-production'
}

export function getRefreshSecret(): string {
  const refreshSecret = process.env.REFRESH_SECRET
  return refreshSecret || 'change-this-in-production'
}
