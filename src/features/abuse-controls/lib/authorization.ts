/**
 * Authorization Helpers for Abuse Controls
 *
 * @deprecated This file has been refactored into a modular structure.
 * Please import from './authorization' instead.
 *
 * Provides authorization checks for suspension operations.
 * Ensures only authorized users can perform sensitive operations.
 *
 * Module structure:
 * - ./authorization/roles.ts - Role definitions and type declarations
 * - ./authorization/permissions.ts - Permission matrix and organization permission checks
 * - ./authorization/utils.ts - Database access and utility functions
 * - ./authorization/policies.ts - Policy enforcement functions
 */

// Re-export everything from the new modular structure for backward compatibility
export {
  // Types and enums
  UserRole,
  OrganizationRole,
  OrganizationPermission,
  DeveloperWithRole,
  OrganizationMember,
  AuthorizationError,
} from './authorization/roles'

export {
  // Permission matrix
  ORGANIZATION_PERMISSION_MATRIX,
  hasOrganizationPermission,
} from './authorization/permissions'

export {
  // Utility functions
  getDeveloperWithRole,
  getOrganizationRole,
  isProjectOwner,
  logAuthorizationAction,
} from './authorization/utils'

export {
  // Policy enforcement
  isOperatorOrAdmin,
  isAdmin,
  requireOperatorOrAdmin,
  requireAdmin,
  requireProjectOwner,
  preventOwnerUnsuspend,
  requireOrganizationPermission,
  requireOrganizationMembershipPermission,
} from './authorization/policies'
