/**
 * Authorization Module
 *
 * Complete authorization system for abuse controls.
 * Re-exports all functionality for backward compatibility.
 */

// Types and enums
export {
  UserRole,
  OrganizationRole,
  OrganizationPermission,
  DeveloperWithRole,
  OrganizationMember,
  AuthorizationError,
} from './roles'

// Permission matrix
export {
  ORGANIZATION_PERMISSION_MATRIX,
  hasOrganizationPermission,
} from './permissions'

// Utility functions
export {
  getDeveloperWithRole,
  getOrganizationRole,
  isProjectOwner,
  logAuthorizationAction,
} from './utils'

// Policy enforcement
export {
  isOperatorOrAdmin,
  isAdmin,
  requireOperatorOrAdmin,
  requireAdmin,
  requireProjectOwner,
  preventOwnerUnsuspend,
  requireOrganizationPermission,
  requireOrganizationMembershipPermission,
} from './policies'
