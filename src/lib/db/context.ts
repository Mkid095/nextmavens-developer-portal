/**
 * Database Context Manager
 *
 * Provides functions for setting and retrieving user context
 * in PostgreSQL database sessions. This is used by Row Level Security
 * policies to enforce data access controls.
 *
 * Usage pattern:
 * 1. At the start of a request, call setUserIdContext() with the user's ID
 * 2. RLS policies use the session variable to filter data access
 * 3. Optionally, call setUserRoleContext() for role-based access
 *
 * Example:
 * ```ts
 * import { setUserIdContext, setUserRoleContext } from '@/lib/db/context'
 *
 * // In an API route, after JWT verification:
 * await setUserIdContext(pool, userId)
 * await setUserRoleContext(pool, userRole)
 *
 * // Now all queries use RLS policies that reference:
 * // - current_setting('app.user_id', true)
 * // - current_setting('app.user_role', true)
 * ```
 */

import type { Pool, PoolClient } from 'pg'

/**
 * Helper to get a client from pool or return the client directly
 */
async function getClient(poolOrClient: Pool | PoolClient): Promise<{
  client: PoolClient
  shouldRelease: boolean
}> {
  if ('connect' in poolOrClient && typeof poolOrClient.connect === 'function') {
    const client = await (poolOrClient as Pool).connect()
    return {
      client,
      shouldRelease: true,
    }
  }
  return {
    client: poolOrClient as PoolClient,
    shouldRelease: false,
  }
}

/**
 * Set the current user ID in the database session
 *
 * This sets a PostgreSQL session variable that can be referenced
 * by Row Level Security policies.
 *
 * @param poolOrClient - Database pool or client
 * @param userId - The user UUID to set as current user
 */
export async function setUserIdContext(
  poolOrClient: Pool | PoolClient,
  userId: string
): Promise<void> {
  const { client, shouldRelease } = await getClient(poolOrClient)

  try {
    await client.query(`SET LOCAL app.user_id = '${userId}'`)
  } finally {
    if (shouldRelease) {
      client.release()
    }
  }
}

/**
 * Set the current user role in the database session
 *
 * This sets a PostgreSQL session variable that can be referenced
 * by Row Level Security policies for role-based access control.
 *
 * @param poolOrClient - Database pool or client
 * @param role - The user role (e.g., 'admin', 'user', 'service')
 */
export async function setUserRoleContext(
  poolOrClient: Pool | PoolClient,
  role: string
): Promise<void> {
  const { client, shouldRelease } = await getClient(poolOrClient)

  try {
    await client.query(`SET LOCAL app.user_role = '${role}'`)
  } finally {
    if (shouldRelease) {
      client.release()
    }
  }
}

/**
 * Set both user ID and role context in one call
 *
 * @param poolOrClient - Database pool or client
 * @param userId - The user UUID to set as current user
 * @param role - The user role (e.g., 'admin', 'user', 'service')
 */
export async function setUserContext(
  poolOrClient: Pool | PoolClient,
  userId: string,
  role: string = 'user'
): Promise<void> {
  const { client, shouldRelease } = await getClient(poolOrClient)

  try {
    await client.query(`SET LOCAL app.user_id = '${userId}'`)
    await client.query(`SET LOCAL app.user_role = '${role}'`)
  } finally {
    if (shouldRelease) {
      client.release()
    }
  }
}

/**
 * Clear user context from the database session
 *
 * Useful for testing or service operations that need to bypass RLS.
 *
 * @param poolOrClient - Database pool or client
 */
export async function clearUserContext(
  poolOrClient: Pool | PoolClient
): Promise<void> {
  const { client, shouldRelease } = await getClient(poolOrClient)

  try {
    await client.query(`SET LOCAL app.user_id = NULL`)
    await client.query(`SET LOCAL app.user_role = NULL`)
  } finally {
    if (shouldRelease) {
      client.release()
    }
  }
}

/**
 * Execute a callback with admin privileges (bypasses RLS)
 *
 * This temporarily disables RLS for the duration of the callback.
 * Use with caution - only for service operations that need full access.
 *
 * @param poolOrClient - Database pool or client
 * @param callback - Function to execute with RLS bypassed
 * @returns Result of the callback
 */
export async function withAdminBypass<T>(
  poolOrClient: Pool | PoolClient,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const { client, shouldRelease } = await getClient(poolOrClient)

  try {
    // Set role to postgres (superuser) to bypass RLS
    await client.query(`SET LOCAL ROLE postgres`)
    const result = await callback(client)
    return result
  } finally {
    // Reset role
    await client.query(`RESET ROLE`)
    if (shouldRelease) {
      client.release()
    }
  }
}

/**
 * Get the current user ID from the database session
 *
 * @param poolOrClient - Database pool or client
 * @returns The current user ID or null if not set
 */
export async function getCurrentUserId(
  poolOrClient: Pool | PoolClient
): Promise<string | null> {
  const { client, shouldRelease } = await getClient(poolOrClient)

  try {
    const result = await client.query(`SELECT current_setting('app.user_id', true) as user_id`)
    return result.rows[0]?.user_id || null
  } finally {
    if (shouldRelease) {
      client.release()
    }
  }
}

/**
 * Get the current user role from the database session
 *
 * @param poolOrClient - Database pool or client
 * @returns The current user role or null if not set
 */
export async function getCurrentUserRole(
  poolOrClient: Pool | PoolClient
): Promise<string | null> {
  const { client, shouldRelease } = await getClient(poolOrClient)

  try {
    const result = await client.query(`SELECT current_setting('app.user_role', true) as user_role`)
    return result.rows[0]?.user_role || null
  } finally {
    if (shouldRelease) {
      client.release()
    }
  }
}
