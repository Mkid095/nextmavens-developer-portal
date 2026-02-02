/**
 * Authorization Helpers for Abuse Controls
 *
 * Provides authorization checks for suspension operations.
 * Ensures only authorized users can perform sensitive operations.
 */

import { getPool } from '@/lib/db'
import type { Developer, AuthenticatedEntity } from '@/lib/auth'

/**
 * User roles for authorization
 */
export enum UserRole {
  /** Regular developer - can manage their own projects */
  DEVELOPER = 'developer',
  /** Platform operator - can manage suspensions across all projects */
  OPERATOR = 'operator',
  /** Platform admin - has full system access */
  ADMIN = 'admin',
}

/**
 * Organization member roles for team-based access control
 *
 * These roles define what members can do within an organization's projects.
 */
export enum OrganizationRole {
  /** Organization owner - full control including user management */
  OWNER = 'owner',
  /** Organization admin - can manage resources but not owners */
  ADMIN = 'admin',
  /** Organization developer - can use and view services */
  DEVELOPER = 'developer',
  /** Organization viewer - read-only access */
  VIEWER = 'viewer',
}

/**
 * Permission flags for organization capabilities
 *
 * Each permission represents a specific action that can be performed
 * within an organization context.
 */
export enum OrganizationPermission {
  /** Delete projects within the organization */
  DELETE_PROJECTS = 'delete_projects',
  /** Manage services (create, update, delete) */
  MANAGE_SERVICES = 'manage_services',
  /** Manage API keys and credentials */
  MANAGE_KEYS = 'manage_keys',
  /** Manage organization members (invite, remove, change roles) */
  MANAGE_USERS = 'manage_users',
  /** View logs and monitoring data */
  VIEW_LOGS = 'view_logs',
  /** Use services (make API calls, invoke functions) */
  USE_SERVICES = 'use_services',
}

/**
 * Permission Matrix for Organization Roles
 *
 * Defines which permissions each organization role has.
 *
 * | Permission      | Owner | Admin | Developer | Viewer |
 * |-----------------|-------|-------|-----------|--------|
 * | delete_projects | ✓     | ✗     | ✗         | ✗      |
 * | manage_services | ✓     | ✓     | ✗         | ✗      |
 * | manage_keys     | ✓     | ✓     | ✗         | ✗      |
 * | manage_users    | ✓     | ✗     | ✗         | ✗      |
 * | view_logs       | ✓     | ✓     | ✓         | ✓      |
 * | use_services    | ✓     | ✓     | ✓         | ✗      |
 */
export const ORGANIZATION_PERMISSION_MATRIX: Record<
  OrganizationRole,
  OrganizationPermission[]
> = {
  [OrganizationRole.OWNER]: [
    OrganizationPermission.DELETE_PROJECTS,
    OrganizationPermission.MANAGE_SERVICES,
    OrganizationPermission.MANAGE_KEYS,
    OrganizationPermission.MANAGE_USERS,
    OrganizationPermission.VIEW_LOGS,
    OrganizationPermission.USE_SERVICES,
  ],
  [OrganizationRole.ADMIN]: [
    OrganizationPermission.MANAGE_SERVICES,
    OrganizationPermission.MANAGE_KEYS,
    OrganizationPermission.VIEW_LOGS,
    OrganizationPermission.USE_SERVICES,
  ],
  [OrganizationRole.DEVELOPER]: [
    OrganizationPermission.VIEW_LOGS,
    OrganizationPermission.USE_SERVICES,
  ],
  [OrganizationRole.VIEWER]: [
    OrganizationPermission.VIEW_LOGS,
  ],
}

/**
 * Developer record with role information
 */
export interface DeveloperWithRole extends Developer {
  role: UserRole
}

/**
 * Authorization error types
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 403
  ) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

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
 * Check if a developer has operator or admin role
 *
 * @param developer - The developer to check
 * @returns true if the developer is an operator or admin
 */
export function isOperatorOrAdmin(developer: DeveloperWithRole): boolean {
  return developer.role === UserRole.OPERATOR || developer.role === UserRole.ADMIN
}

/**
 * Check if a developer has admin role
 *
 * @param developer - The developer to check
 * @returns true if the developer is an admin
 */
export function isAdmin(developer: DeveloperWithRole): boolean {
  return developer.role === UserRole.ADMIN
}

/**
 * Require operator or admin role for an operation
 *
 * Use this function in API endpoints to ensure only operators/admins
 * can perform sensitive operations like manual suspension/unsuspension.
 *
 * @param developer - The authenticated developer (or JwtPayload with id and email)
 * @throws AuthorizationError if the developer is not an operator/admin
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const developer = await authenticateRequest(req)
 *   await requireOperatorOrAdmin(developer)
 *   // Proceed with operator-only operation
 * }
 * ```
 */
export async function requireOperatorOrAdmin(
  developer: AuthenticatedEntity
): Promise<DeveloperWithRole> {
  const developerWithRole = await getDeveloperWithRole(developer.id)

  if (!isOperatorOrAdmin(developerWithRole)) {
    console.warn(
      `[Authorization] Unauthorized attempt by ${developer.email} to access operator endpoint`
    )
    throw new AuthorizationError(
      'This operation requires operator or administrator privileges',
      403
    )
  }

  return developerWithRole
}

/**
 * Require admin role for an operation
 *
 * Use this function in API endpoints to ensure only admins
 * can perform highly sensitive operations.
 *
 * @param developer - The authenticated developer (or JwtPayload with id and email)
 * @throws AuthorizationError if the developer is not an admin
 *
 * @example
 * ```typescript
 * export async function DELETE(req: NextRequest) {
 *   const developer = await authenticateRequest(req)
 *   await requireAdmin(developer)
 *   // Proceed with admin-only operation
 * }
 * ```
 */
export async function requireAdmin(
  developer: AuthenticatedEntity
): Promise<DeveloperWithRole> {
  const developerWithRole = await getDeveloperWithRole(developer.id)

  if (!isAdmin(developerWithRole)) {
    console.warn(
      `[Authorization] Unauthorized attempt by ${developer.email} to access admin endpoint`
    )
    throw new AuthorizationError(
      'This operation requires administrator privileges',
      403
    )
  }

  return developerWithRole
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
 * Require project ownership for an operation
 *
 * Use this function in API endpoints to ensure only project owners
 * can access their own project data.
 *
 * @param developerId - The authenticated developer's ID
 * @param projectId - The project ID to check
 * @throws AuthorizationError if the developer does not own the project
 *
 * @example
 * ```typescript
 * export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
 *   const developer = await authenticateRequest(req)
 *   await requireProjectOwner(developer.id, params.projectId)
 *   // Proceed with project-specific operation
 * }
 * ```
 */
export async function requireProjectOwner(
  developerId: string,
  projectId: string
): Promise<void> {
  const isOwner = await isProjectOwner(developerId, projectId)

  if (!isOwner) {
    console.warn(
      `[Authorization] Developer ${developerId} attempted to access project ${projectId} without ownership`
    )
    throw new AuthorizationError(
      'You do not have permission to access this project',
      403
    )
  }
}

/**
 * Prevent project owners from unsuspending their own suspended projects
 *
 * This is a critical security check - project owners should NOT be able
 * to unsuspend their own projects after they've been suspended for abuse.
 * Only operators/admins can unsuspend projects.
 *
 * @param developerId - The authenticated developer's ID
 * @param projectId - The project ID to check
 * @throws AuthorizationError if the developer owns the project
 *
 * @example
 * ```typescript
 * export async function DELETE(req: NextRequest, { params }: { params: { projectId: string } }) {
 *   const developer = await authenticateRequest(req)
 *   // Prevent project owners from unsuspending their own projects
 *   await preventOwnerUnsuspend(developer.id, params.projectId)
 *   // Proceed with unsuspension (only operators/admins can reach here)
 * }
 * ```
 */
export async function preventOwnerUnsuspend(
  developerId: string,
  projectId: string
): Promise<void> {
  const isOwner = await isProjectOwner(developerId, projectId)

  if (isOwner) {
    console.warn(
      `[Authorization] Project owner ${developerId} attempted to unsuspend their own project ${projectId}`
    )
    throw new AuthorizationError(
      'Project owners cannot unsuspend their own projects. Please contact support.',
      403
    )
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

/**
 * Organization member interface with role information
 */
export interface OrganizationMember {
  orgId: string
  userId: string
  role: OrganizationRole
}

/**
 * Check if an organization role has a specific permission
 *
 * @param role - The organization role to check
 * @param permission - The permission to verify
 * @returns true if the role has the permission
 *
 * @example
 * ```typescript
 * if (hasOrganizationPermission(OrganizationRole.ADMIN, OrganizationPermission.MANAGE_SERVICES)) {
 *   // Allow service management
 * }
 * ```
 */
export function hasOrganizationPermission(
  role: OrganizationRole,
  permission: OrganizationPermission
): boolean {
  return ORGANIZATION_PERMISSION_MATRIX[role].includes(permission)
}

/**
 * Require a specific organization permission for an operation
 *
 * Use this function in API endpoints to ensure organization members
 * have the required permission before performing an action.
 *
 * @param role - The user's organization role
 * @param permission - The required permission
 * @throws AuthorizationError if the role lacks the permission
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const developer = await authenticateRequest(req)
 *   const memberRole = await getOrganizationRole(developer.id, orgId)
 *   await requireOrganizationPermission(memberRole, OrganizationPermission.MANAGE_KEYS)
 *   // Proceed with key management
 * }
 * ```
 */
export function requireOrganizationPermission(
  role: OrganizationRole,
  permission: OrganizationPermission
): void {
  if (!hasOrganizationPermission(role, permission)) {
    console.warn(
      `[Authorization] Role ${role} attempted to access permission ${permission}`
    )
    throw new AuthorizationError(
      `This operation requires the '${permission}' permission`,
      403
    )
  }
}

/**
 * Get a developer's organization role
 *
 * @param developerId - The developer ID to look up
 * @param organizationId - The organization ID to check
 * @returns The developer's role in the organization
 * @throws Error if the developer is not a member of the organization
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
 * Require organization membership with a specific permission
 *
 * Convenience function that combines getting the organization role
 * and checking for a specific permission.
 *
 * @param developerId - The authenticated developer's ID
 * @param organizationId - The organization ID
 * @param permission - The required permission
 * @throws AuthorizationError if not a member or lacks permission
 *
 * @example
 * ```typescript
 * export async function DELETE(req: NextRequest, { params }: { params: { orgId: string } }) {
 *   const developer = await authenticateRequest(req)
 *   await requireOrganizationMembershipPermission(
 *     developer.id,
 *     params.orgId,
 *     OrganizationPermission.MANAGE_USERS
 *   )
 *   // Proceed with user management
 * }
 * ```
 */
export async function requireOrganizationMembershipPermission(
  developerId: string,
  organizationId: string,
  permission: OrganizationPermission
): Promise<void> {
  const role = await getOrganizationRole(developerId, organizationId)
  requireOrganizationPermission(role, permission)
}
