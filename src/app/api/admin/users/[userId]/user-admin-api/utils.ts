/**
 * Admin Users API - Utility Functions
 *
 * Shared utility functions for user admin operations.
 */

import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import type { DbUser, UserData } from './types'

/**
 * Convert database user to API response format
 */
export function dbUserToUserData(dbUser: DbUser, userMetadata?: Record<string, unknown>): UserData {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    organization: dbUser.organization,
    role: dbUser.role,
    created_at: dbUser.created_at,
    updated_at: dbUser.updated_at,
    auth_provider: 'email',
    auth_info: {
      user_id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      tenant_id: 'default',
      role: dbUser.role || 'member',
      is_verified: true,
      last_login_at: null,
      sign_in_count: 0,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at || dbUser.created_at,
    },
    user_metadata: userMetadata || {},
  }
}

/**
 * Fetch user from database by ID
 */
export async function fetchUserById(userId: string): Promise<DbUser | null> {
  const pool = getPool()

  const userResult = await pool.query(
    `SELECT id, email, name, organization, role, created_at, updated_at
     FROM developers
     WHERE id = $1`,
    [userId]
  )

  return userResult.rows[0] || null
}

/**
 * Create user response
 */
export function createUserResponse(dbUser: DbUser, userMetadata?: Record<string, unknown>): NextResponse {
  return NextResponse.json({
    user: dbUserToUserData(dbUser, userMetadata),
  })
}

/**
 * Handle authentication errors with generic messages
 */
export function handleAuthError(errorMessage: string): NextResponse | null {
  if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  if (errorMessage.includes('operator or administrator') || errorMessage.includes('administrator privileges')) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Check if user exists by ID
 */
export async function userExists(userId: string): Promise<boolean> {
  const pool = getPool()

  const result = await pool.query(
    'SELECT id FROM developers WHERE id = $1',
    [userId]
  )

  return result.rows.length > 0
}
