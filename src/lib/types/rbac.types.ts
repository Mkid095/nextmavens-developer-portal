/**
 * RBAC Types
 *
 * Type definitions for Role-Based Access Control (RBAC) system.
 * These types define permissions, roles, and role-permission mappings
 * for enforcing access control across the platform.
 *
 * US-001: Define Permissions
 */

/**
 * Permission enum defining all available permissions in the platform.
 * Each permission represents a specific action that can be performed.
 *
 * Permissions are organized by resource:
 * - projects.*: Project-level operations
 * - database.*: Database operations
 *
 * @see US-001: Define Permissions
 */
export enum Permission {
  // Project permissions
  PROJECTS_DELETE = 'projects.delete',
  PROJECTS_MANAGE_SERVICES = 'projects.manage_services',
  PROJECTS_MANAGE_KEYS = 'projects.manage_keys',
  PROJECTS_MANAGE_USERS = 'projects.manage_users',
  PROJECTS_VIEW_LOGS = 'projects.view_logs',
  PROJECTS_USE_SERVICES = 'projects.use_services',

  // Database permissions
  DATABASE_WRITE = 'database.write',
  DATABASE_READ = 'database.read',
}

/**
 * Role enum defining all available roles in the platform.
 * Each role has a specific set of permissions associated with it.
 *
 * Role hierarchy (from most to least privileged):
 * - Owner: Full control including project deletion
 * - Admin: Full control except project deletion
 * - Developer: Can use services and view logs, read database
 * - Viewer: Read-only access to logs and database
 *
 * @see US-002: Define Role Permissions
 */
export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
}

/**
 * Type alias for permission checking functions.
 * Used to ensure type safety when checking permissions.
 */
export type PermissionChecker = (permission: Permission) => boolean;

/**
 * Role-to-permissions mapping.
 * Defines which permissions each role has.
 *
 * Owner: All permissions (including project deletion)
 * Admin: All permissions except projects.delete
 * Developer: projects.view_logs, projects.use_services, database.read
 * Viewer: projects.view_logs, database.read
 *
 * @see US-002: Define Role Permissions
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, Readonly<Permission[]>>> = {
  [Role.OWNER]: [
    Permission.PROJECTS_DELETE,
    Permission.PROJECTS_MANAGE_SERVICES,
    Permission.PROJECTS_MANAGE_KEYS,
    Permission.PROJECTS_MANAGE_USERS,
    Permission.PROJECTS_VIEW_LOGS,
    Permission.PROJECTS_USE_SERVICES,
    Permission.DATABASE_WRITE,
    Permission.DATABASE_READ,
  ],
  [Role.ADMIN]: [
    Permission.PROJECTS_MANAGE_SERVICES,
    Permission.PROJECTS_MANAGE_KEYS,
    Permission.PROJECTS_MANAGE_USERS,
    Permission.PROJECTS_VIEW_LOGS,
    Permission.PROJECTS_USE_SERVICES,
    Permission.DATABASE_WRITE,
    Permission.DATABASE_READ,
  ],
  [Role.DEVELOPER]: [
    Permission.PROJECTS_VIEW_LOGS,
    Permission.PROJECTS_USE_SERVICES,
    Permission.DATABASE_READ,
  ],
  [Role.VIEWER]: [
    Permission.PROJECTS_VIEW_LOGS,
    Permission.DATABASE_READ,
  ],
} as const;

/**
 * Check if a role has a specific permission.
 *
 * @param role - The role to check
 * @param permission - The permission to check for
 * @returns True if the role has the permission, false otherwise
 *
 * @example
 * ```ts
 * if (hasPermission(Role.ADMIN, Permission.DATABASE_WRITE)) {
 *   // Allow database write operation
 * }
 * ```
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a given role.
 *
 * @param role - The role to get permissions for
 * @returns Array of permissions for the role
 *
 * @example
 * ```ts
 * const adminPermissions = getPermissionsForRole(Role.ADMIN);
 * // Returns: [Permission.PROJECTS_MANAGE_SERVICES, ...]
 * ```
 */
export function getPermissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a user with a given role can perform a specific action.
 * This is the main permission checking function used throughout the codebase.
 *
 * @param userRole - The user's role
 * @param requiredPermission - The permission required for the action
 * @returns True if the user has the required permission
 *
 * @example
 * ```ts
 * if (canUserPerformAction(userRole, Permission.PROJECTS_DELETE)) {
 *   // Allow project deletion
 * } else {
 *   // Return 403 Forbidden
 * }
 * ```
 */
export function canUserPerformAction(
  userRole: Role,
  requiredPermission: Permission
): boolean {
  return hasPermission(userRole, requiredPermission);
}

/**
 * Permission metadata for UI display and documentation.
 * Provides human-readable labels and descriptions for each permission.
 */
export const PERMISSION_METADATA: Readonly<Record<Permission, {
  label: string;
  description: string;
  category: 'project' | 'database';
}>> = {
  [Permission.PROJECTS_DELETE]: {
    label: 'Delete Projects',
    description: 'Allows permanent deletion of projects',
    category: 'project',
  },
  [Permission.PROJECTS_MANAGE_SERVICES]: {
    label: 'Manage Services',
    description: 'Allows enabling/disabling database, auth, realtime, and storage services',
    category: 'project',
  },
  [Permission.PROJECTS_MANAGE_KEYS]: {
    label: 'Manage API Keys',
    description: 'Allows creating, rotating, and revoking API keys',
    category: 'project',
  },
  [Permission.PROJECTS_MANAGE_USERS]: {
    label: 'Manage Users',
    description: 'Allows inviting, removing, and changing roles of team members',
    category: 'project',
  },
  [Permission.PROJECTS_VIEW_LOGS]: {
    label: 'View Logs',
    description: 'Allows viewing project logs and audit trails',
    category: 'project',
  },
  [Permission.PROJECTS_USE_SERVICES]: {
    label: 'Use Services',
    description: 'Allows using enabled services (database, auth, realtime, storage)',
    category: 'project',
  },
  [Permission.DATABASE_WRITE]: {
    label: 'Write to Database',
    description: 'Allows INSERT, UPDATE, DELETE operations on the database',
    category: 'database',
  },
  [Permission.DATABASE_READ]: {
    label: 'Read from Database',
    description: 'Allows SELECT queries on the database',
    category: 'database',
  },
} as const;

/**
 * Role metadata for UI display and documentation.
 * Provides human-readable labels and descriptions for each role.
 */
export const ROLE_METADATA: Readonly<Record<Role, {
  label: string;
  description: string;
  permissions: readonly Permission[];
}>> = {
  [Role.OWNER]: {
    label: 'Owner',
    description: 'Full control of the project, including deletion',
    permissions: ROLE_PERMISSIONS[Role.OWNER],
  },
  [Role.ADMIN]: {
    label: 'Admin',
    description: 'Full control of the project, except deletion',
    permissions: ROLE_PERMISSIONS[Role.ADMIN],
  },
  [Role.DEVELOPER]: {
    label: 'Developer',
    description: 'Can use services and view logs, read-only database access',
    permissions: ROLE_PERMISSIONS[Role.DEVELOPER],
  },
  [Role.VIEWER]: {
    label: 'Viewer',
    description: 'Read-only access to logs and database',
    permissions: ROLE_PERMISSIONS[Role.VIEWER],
  },
} as const;
