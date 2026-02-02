/**
 * Role Definitions and Type Declarations
 *
 * Defines all user and organization roles used throughout the authorization system.
 * This file contains type definitions only - no business logic.
 */

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
 * Developer record with role information
 */
export interface DeveloperWithRole {
  id: string
  email: string
  name: string | null
  organization: string | null
  role: UserRole
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
