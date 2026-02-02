/**
 * Authentication Library - JWT Token Functions
 */

import jwt from 'jsonwebtoken'
import { createError, ErrorCode } from '@/lib/errors'
import type { JwtPayload, Developer } from './types'
import { getJwtSecret, getRefreshSecret, TOKEN_EXPIRATION } from './constants'

/**
 * Generate an access token for a developer
 * @param developer - The developer to generate a token for
 * @param projectId - The project ID to include in the token
 * @returns JWT access token
 */
export function generateAccessToken(developer: Developer, projectId: string): string {
  return jwt.sign(
    { id: developer.id, email: developer.email, project_id: projectId },
    getJwtSecret(),
    { expiresIn: TOKEN_EXPIRATION.ACCESS_TOKEN }
  )
}

/**
 * Generate a refresh token for a developer
 * @param developerId - The developer ID to generate a refresh token for
 * @returns JWT refresh token
 */
export function generateRefreshToken(developerId: string): string {
  return jwt.sign(
    { id: developerId },
    getRefreshSecret(),
    { expiresIn: TOKEN_EXPIRATION.REFRESH_TOKEN }
  )
}

/**
 * Verify an access token and return the payload
 * @param token - The JWT access token to verify
 * @returns The JWT payload with project_id claim
 * @throws PlatformError with KEY_INVALID code if verification fails
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    if (typeof decoded === 'string') {
      throw createError(ErrorCode.KEY_INVALID, 'Invalid token format')
    }
    // Ensure the decoded token has the required properties
    if (!decoded.id || !decoded.email) {
      throw createError(ErrorCode.KEY_INVALID, 'Invalid token structure')
    }
    // US-001: Require project_id in JWT
    if (!decoded.project_id) {
      throw createError(ErrorCode.KEY_INVALID, 'Missing project_id claim')
    }
    return decoded as unknown as JwtPayload
  } catch (error) {
    // If it's already a PlatformError, re-throw it
    if (error instanceof Error && error.name === 'PlatformError') {
      throw error
    }
    // Otherwise wrap as KEY_INVALID
    if (error instanceof Error && error.message.includes('jwt')) {
      throw createError(ErrorCode.KEY_INVALID, 'Invalid or expired token')
    }
    throw createError(ErrorCode.KEY_INVALID, 'Invalid token')
  }
}

/**
 * Verify a refresh token and return the payload
 * @param token - The JWT refresh token to verify
 * @returns The decoded JWT payload with developer ID
 * @throws Error if verification fails
 */
export function verifyRefreshToken(token: string): { id: string } {
  try {
    const decoded = jwt.verify(token, getRefreshSecret())
    if (typeof decoded === 'string') {
      throw new Error('Invalid token format')
    }
    if (!decoded.id) {
      throw new Error('Invalid token structure')
    }
    return decoded as { id: string }
  } catch (error) {
    if (error instanceof Error && error.message.includes('jwt')) {
      throw new Error('Invalid or expired refresh token')
    }
    throw error
  }
}
