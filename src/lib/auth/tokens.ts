/**
 * Token Management
 */

import * as jwt from 'jsonwebtoken'
import { getJwtSecret, getRefreshSecret } from './config'
import type { JwtPayload } from './types'
import type { Developer } from './types'
import { createError, ErrorCode } from '../errors'

export function generateAccessToken(developer: Developer, projectId: string): string {
  return jwt.sign(
    { id: developer.id, email: developer.email, project_id: projectId },
    getJwtSecret(),
    { expiresIn: '1h' }
  )
}

export function generateRefreshToken(developerId: string): string {
  return jwt.sign(
    { id: developerId },
    getRefreshSecret(),
    { expiresIn: '7d' }
  )
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    if (typeof decoded === 'string') {
      throw createError(ErrorCode.KEY_INVALID, 'Invalid token format')
    }
    if (!decoded.id || !decoded.email) {
      throw createError(ErrorCode.KEY_INVALID, 'Invalid token structure')
    }
    if (!decoded.project_id) {
      throw createError(ErrorCode.KEY_INVALID, 'Missing project_id claim')
    }
    return decoded as unknown as JwtPayload
  } catch (error) {
    if (error instanceof Error && error.name === 'PlatformError') {
      throw error
    }
    if (error instanceof Error && error.message.includes('jwt')) {
      throw createError(ErrorCode.KEY_INVALID, 'Invalid or expired token')
    }
    throw createError(ErrorCode.KEY_INVALID, 'Invalid token')
  }
}
