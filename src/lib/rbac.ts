/**
 * RBAC Permission Checker
 *
 * Core permission checking functions for Role-Based Access Control (RBAC).
 * This module provides functions to check if users have specific permissions
 * based on their role within an organization.
 *
 * US-003: Create Permission Checker
 */

import { Pool } from 'pg';
import { hasPermission, Role, Permission } from './types/rbac.types';

/**
 * User context for permission checking.
 * Represents a user with their ID for database lookup.
 */
export interface User {
  id: string;
}

/**
 * Organization member record from the database.
 * Matches the control_plane.organization_members table structure.
 */
interface OrganizationMember {
  org_id: string;
  user_id: string;
  role: string;
  joined_at: Date;
}

/**
 * Result of a permission check.
 * Provides detailed information about why permission was granted or denied.
 */
export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
  role?: Role;
}

/**
 * Get a user's role within an organization from the database.
 *
 * @param pool - Database connection pool
 * @param userId - The user's ID
 * @param organizationId - The organization's ID
 * @returns The user's role within the organization, or null if not a member
 *
 * @example
 * ```ts
 * const role = await getUserRole(pool, 'user-123', 'org-456');
 * if (role) {
 *   console.log(`User is ${role}`);
 * }
 * ```
 */
export async function getUserRole(
  pool: Pool,
  userId: string,
  organizationId: string
): Promise<Role | null> {
  const result = await pool.query<OrganizationMember>(
    `SELECT role FROM control_plane.organization_members
     WHERE user_id = $1 AND org_id = $2`,
    [userId, organizationId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const roleString = result.rows[0].role;

  // Validate that the role is a valid Role enum value
  if (Object.values(Role).includes(roleString as Role)) {
    return roleString as Role;
  }

  // Invalid role in database
  return null;
}

/**
 * Check if a user has a specific permission within an organization.
 *
 * This is the main permission checking function used throughout the codebase.
 * It retrieves the user's role from the database and checks if the role
 * has the required permission.
 *
 * @param user - The user to check permissions for
 * @param organizationId - The organization to check permissions in
 * @param permission - The permission to check
 * @returns Promise resolving to a PermissionCheckResult with details
 *
 * @example
 * ```ts
 * const result = await checkUserPermission(
 *   { id: 'user-123' },
 *   'org-456',
 *   Permission.PROJECTS_DELETE
 * );
 *
 * if (result.granted) {
 *   // Allow the action
 * } else {
 *   // Deny with reason
 *   console.log(result.reason); // "User is not a member of this organization"
 * }
 * ```
 */
export async function checkUserPermission(
  user: User,
  organizationId: string,
  permission: Permission
): Promise<PermissionCheckResult> {
  // Get the database pool
  const { getPool } = await import('./db');
  const pool = getPool();

  // Get the user's role in the organization
  const role = await getUserRole(pool, user.id, organizationId);

  // User is not a member of the organization
  if (!role) {
    return {
      granted: false,
      reason: 'User is not a member of this organization',
    };
  }

  // Check if the role has the required permission
  const permitted = hasPermission(role, permission);

  if (permitted) {
    return {
      granted: true,
      role,
    };
  }

  return {
    granted: false,
    reason: `User role '${role}' does not have permission '${permission}'`,
    role,
  };
}

/**
 * Simplified permission check that returns a boolean.
 * Use this when you don't need detailed error information.
 *
 * @param user - The user to check permissions for
 * @param organizationId - The organization to check permissions in
 * @param permission - The permission to check
 * @returns Promise resolving to true if the user has the permission
 *
 * @example
 * ```ts
 * if (await hasPermission({ id: 'user-123' }, 'org-456', Permission.DATABASE_WRITE)) {
 *   // Allow database write
 * }
 * ```
 */
export async function hasPermissionForOrganization(
  user: User,
  organizationId: string,
  permission: Permission
): Promise<boolean> {
  const result = await checkUserPermission(user, organizationId, permission);
  return result.granted;
}

/**
 * Check if a user is a member of an organization.
 *
 * @param user - The user to check
 * @param organizationId - The organization to check membership in
 * @returns Promise resolving to true if the user is a member
 *
 * @example
 * ```ts
 * if (await isOrganizationMember({ id: 'user-123' }, 'org-456')) {
 *   // User is a member
 * }
 * ```
 */
export async function isOrganizationMember(
  user: User,
  organizationId: string
): Promise<boolean> {
  const { getPool } = await import('./db');
  const pool = getPool();

  const result = await pool.query<OrganizationMember>(
    `SELECT 1 FROM control_plane.organization_members
     WHERE user_id = $1 AND org_id = $2`,
    [user.id, organizationId]
  );

  return result.rows.length > 0;
}

/**
 * Get all members of an organization with their roles.
 *
 * @param pool - Database connection pool
 * @param organizationId - The organization's ID
 * @returns Promise resolving to array of organization members
 *
 * @example
 * ```ts
 * const members = await getOrganizationMembers(pool, 'org-456');
 * for (const member of members) {
 *   console.log(`${member.user_id} is ${member.role}`);
 * }
 * ```
 */
export async function getOrganizationMembers(
  pool: Pool,
  organizationId: string
): Promise<OrganizationMember[]> {
  const result = await pool.query<OrganizationMember>(
    `SELECT org_id, user_id, role, joined_at
     FROM control_plane.organization_members
     WHERE org_id = $1
     ORDER BY joined_at ASC`,
    [organizationId]
  );

  return result.rows;
}

/**
 * Get a user's role from the organization_members table (legacy alias).
 * This function exists for backward compatibility with the PRD spec.
 *
 * @deprecated Use getUserRole instead for better type safety
 */
export async function getUserRoleInOrganization(
  pool: Pool,
  userId: string,
  organizationId: string
): Promise<string | null> {
  const role = await getUserRole(pool, userId, organizationId);
  return role;
}
