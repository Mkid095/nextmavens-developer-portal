/**
 * Authentication Configuration
 */

import { createError, ErrorCode } from '../errors'

export function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return jwtSecret
}

export function getRefreshSecret(): string {
  const refreshSecret = process.env.REFRESH_SECRET
  if (!refreshSecret) {
    throw new Error('REFRESH_SECRET environment variable is required')
  }
  return refreshSecret
}
