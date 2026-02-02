/**
 * Authorization Policies and Enforcement
 *
 * Provides policy enforcement functions for role-based access control.
 * These functions check permissions and throw AuthorizationError when checks fail.
 */

import type { AuthenticatedEntity } from '@/lib/auth'
import { UserRole, OrganizationRole, DeveloperWithRole, AuthorizationError } from './roles'
import { OrganizationPermission } from './permissions'
import {
  getDeveloperWithRole,
  getOrganizationRole,
  isProjectOwner,
} from './utils'

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
  const { hasOrganizationPermission } = require('./permissions')

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
