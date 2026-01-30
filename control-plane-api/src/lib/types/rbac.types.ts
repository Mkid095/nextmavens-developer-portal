/**
 * RBAC Types
 *
 * Type definitions for Role-Based Access Control (RBAC) system.
 * These types define permissions, roles, and role-permission mappings
 * for enforcing access control across the platform.
 *
 * US-008: Apply Permissions to User Management
 */

/**
 * Permission enum defining all available permissions in the platform.
 * Each permission represents a specific action that can be performed.
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
 */
export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
}

/**
 * Role-to-permissions mapping.
 * Defines which permissions each role has.
 *
 * Owner: All permissions (including project deletion)
 * Admin: All permissions except projects.delete
 * Developer: projects.view_logs, projects.use_services, database.read
 * Viewer: projects.view_logs, database.read
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
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a given role.
 */
export function getPermissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
