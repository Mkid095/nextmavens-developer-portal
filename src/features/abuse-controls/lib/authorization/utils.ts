/**
 * Authorization Utilities and Database Access
 *
 * Provides utility functions for fetching developer and organization
 * role information from the database.
 */

import { getPool } from '@/lib/db'
import type { Developer, AuthenticatedEntity } from '@/lib/auth'
import { UserRole, DeveloperWithRole, OrganizationRole, AuthorizationError } from './roles'

/**
 * Get developer with role information from the database
 *
 * @param developerId - The developer ID to look up
 * @returns Developer with role information
 * @throws Error if developer not found
 */
export async function getDeveloperWithRole(
  developerId: string
): Promise<DeveloperWithRole> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT id, email, name, organization, role
      FROM developers
      WHERE id = $1
      `,
      [developerId]
    )

    if (result.rows.length === 0) {
      throw new Error('Developer not found')
    }

    const row = result.rows[0]

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      organization: row.organization,
      role: (row.role || UserRole.DEVELOPER) as UserRole,
    }
  } catch (error) {
    console.error('[Authorization] Error fetching developer role:', error)
    throw new Error('Failed to fetch developer information')
  }
}

/**
 * Get a developer's organization role
 *
 * @param developerId - The developer ID to look up
 * @param organizationId - The organization ID to check
 * @returns The developer's role in the organization
 * @throws AuthorizationError if the developer is not a member of the organization
 */
export async function getOrganizationRole(
  developerId: string,
  organizationId: string
): Promise<OrganizationRole> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT role
      FROM control_plane.organization_members
      WHERE org_id = $1 AND user_id = $2
      `,
      [organizationId, developerId]
    )

    if (result.rows.length === 0) {
      throw new AuthorizationError(
        'You are not a member of this organization',
        403
      )
    }

    return result.rows[0].role as OrganizationRole
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error
    }
    console.error('[Authorization] Error fetching organization role:', error)
    throw new Error('Failed to fetch organization membership')
  }
}

/**
 * Check if a developer owns a project
 *
 * @param developerId - The developer ID to check
 * @param projectId - The project ID to check
 * @returns true if the developer owns the project
 */
export async function isProjectOwner(
  developerId: string,
  projectId: string
): Promise<boolean> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT id
      FROM projects
      WHERE id = $1 AND developer_id = $2
      `,
      [projectId, developerId]
    )

    return result.rows.length > 0
  } catch (error) {
    console.error('[Authorization] Error checking project ownership:', error)
    return false
  }
}

/**
 * Log authorization action for audit trail
 *
 * @param action - The action being performed
 * @param developerId - The developer performing the action
 * @param projectId - The project being affected
 * @param metadata - Additional metadata about the action
 */
export async function logAuthorizationAction(
  action: string,
  developerId: string,
  projectId: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `
      INSERT INTO suspension_history (project_id, action, reason, notes)
      VALUES ($1, $2, $3, $4)
      `,
      [
        projectId,
        action,
        JSON.stringify({
          performed_by: developerId,
          timestamp: new Date().toISOString(),
          ...metadata,
        }),
        JSON.stringify(metadata),
      ]
    )

    console.log(
      `[Authorization] Logged action: ${action} by ${developerId} on project ${projectId}`
    )
  } catch (error) {
    console.error('[Authorization] Error logging authorization action:', error)
    // Don't throw - logging failure shouldn't block the operation
  }
}
