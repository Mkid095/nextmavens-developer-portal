/**
 * RBAC Permission Checking
 *
 * Provides permission checking functions for the RBAC system.
 *
 * US-008: Apply Permissions to User Management
 */

import { getPool } from './db'
import { Permission, Role, hasPermission } from './types/rbac.types'
import { createError, ErrorCode } from './errors'

/**
 * User type for RBAC operations.
 */
export type User = { id: string }

/**
 * Result of a permission check.
 */
export interface PermissionCheckResult {
  granted: boolean
  reason?: string
  role?: Role
}

/**
 * Get a user's role within an organization.
 *
 * @param userId - The user ID to look up
 * @param organizationId - The organization ID to check membership in
 * @returns The user's role or null if not a member
 */
export async function getUserRole(
  userId: string,
  organizationId: string
): Promise<Role | null> {
  const pool = getPool()

  const result = await pool.query(
    `SELECT role
     FROM control_plane.organization_members
     WHERE org_id = $1 AND user_id = $2`,
    [organizationId, userId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const role = result.rows[0].role
  // Map database role string to Role enum
  return role as Role
}

/**
 * Check if a user has a specific permission within an organization.
 *
 * @param user - The user to check
 * @param organizationId - The organization ID to check permissions in
 * @param permission - The permission to check for
 * @returns PermissionCheckResult with granted status and reason
 */
export async function checkUserPermission(
  user: User,
  organizationId: string,
  permission: Permission
): Promise<PermissionCheckResult> {
  // Get user's role in the organization
  const role = await getUserRole(user.id, organizationId)

  if (!role) {
    return {
      granted: false,
      reason: 'User is not a member of this organization',
    }
  }

  // Check if the role has the required permission
  const permitted = hasPermission(role, permission)

  if (!permitted) {
    return {
      granted: false,
      reason: `User with role '${role}' does not have permission '${permission}'`,
      role,
    }
  }

  return {
    granted: true,
    role,
  }
}

/**
 * Check if a user is a member of an organization.
 *
 * @param userId - The user ID to check
 * @param organizationId - The organization ID to check
 * @returns True if the user is a member
 */
export async function isOrganizationMember(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  return role !== null
}

/**
 * Get all members of an organization with their roles.
 *
 * @param organizationId - The organization ID
 * @returns Array of members with their user IDs and roles
 */
export async function getOrganizationMembers(
  organizationId: string
): Promise<Array<{ userId: string; role: Role }>> {
  const pool = getPool()

  const result = await pool.query(
    `SELECT user_id, role
     FROM control_plane.organization_members
     WHERE org_id = $1`,
    [organizationId]
  )

  return result.rows.map((row) => ({
    userId: row.user_id,
    role: row.role as Role,
  }))
}
