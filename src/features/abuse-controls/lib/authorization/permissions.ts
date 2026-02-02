/**
 * Permission Matrix and Organization Permission Checks
 *
 * Defines which permissions each organization role has and provides
 * functions to check organization-level permissions.
 */

import { OrganizationRole, OrganizationPermission } from './roles'

// Re-export for convenience
export { OrganizationPermission }

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

export type { OrganizationRole }
