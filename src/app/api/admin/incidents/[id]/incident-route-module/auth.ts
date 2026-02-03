/**
 * Incident Route Module - Authentication & Authorization
 */

import type { NextRequest } from 'next/server'
import { verifyAccessToken, type Developer } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { SQL_QUERIES, AUTHORIZED_ROLES, ERROR_MESSAGES } from './constants'

/**
 * Authenticate and get developer from request
 */
export async function authenticateAndGetDeveloper(
  req: NextRequest
): Promise<Developer> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error(ERROR_MESSAGES.NO_TOKEN)
  }

  const token = authHeader.substring(7)
  const payload = verifyAccessToken(token)

  // Get full developer info from database
  const pool = getPool()
  const result = await pool.query(SQL_QUERIES.GET_DEVELOPER, [payload.id])

  if (result.rows.length === 0) {
    throw new Error(ERROR_MESSAGES.INVALID_TOKEN)
  }

  return result.rows[0] as Developer
}

/**
 * Require operator or admin role
 */
export async function requireOperatorOrAdmin(developer: Developer): Promise<void> {
  const pool = getPool()

  // Check developer role from database
  const result = await pool.query(SQL_QUERIES.GET_DEVELOPER_ROLE, [developer.id])

  if (result.rows.length === 0) {
    throw new Error('Developer not found')
  }

  const role = result.rows[0].role
  if (!AUTHORIZED_ROLES.includes(role)) {
    throw new Error(ERROR_MESSAGES.INSUFFICIENT_PRIVILEGES)
  }
}
