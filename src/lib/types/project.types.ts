/**
 * Project Lifecycle Types
 *
 * Defines the project status enum and related types for project lifecycle management.
 * PRD: US-001 from prd-project-lifecycle.json
 */

/**
 * Project status enum matching the database schema
 * Values: created, active, suspended, archived, deleted
 */
export type ProjectStatus =
  | 'created'
  | 'active'
  | 'suspended'
  | 'archived'
  | 'deleted'

/**
 * Project status behaviors
 * Defines what services are available in each state
 */
export interface ProjectStatusBehaviors {
  // CREATED: Initial state after provisioning, keys work, services active
  created: {
    keys_work: true
    services_active: true
    data_access: 'full'
  }
  // ACTIVE: Normal operating state, keys work, services active
  active: {
    keys_work: true
    services_active: true
    data_access: 'full'
  }
  // SUSPENDED: Abuse detected or limits exceeded, keys don't work, services disabled, data read-only
  suspended: {
    keys_work: false
    services_active: false
    data_access: 'read_only'
  }
  // ARCHIVED: User archived, keys don't work, services disabled, data read-only
  archived: {
    keys_work: false
    services_active: false
    data_access: 'read_only'
  }
  // DELETED: Soft deleted, keys don't work, services disabled, data to be deleted after grace period
  deleted: {
    keys_work: false
    services_active: false
    data_access: 'none'
  }
}

/**
 * Valid state transitions for project status
 */
export type ValidStatusTransition =
  | { from: 'created'; to: 'active' }
  | { from: 'created'; to: 'deleted' }
  | { from: 'active'; to: 'suspended' }
  | { from: 'active'; to: 'archived' }
  | { from: 'active'; to: 'deleted' }
  | { from: 'suspended'; to: 'active' }
  | { from: 'suspended'; to: 'archived' }
  | { from: 'suspended'; to: 'deleted' }
  | { from: 'archived'; to: 'active' }
  | { from: 'archived'; to: 'deleted' }

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  fromStatus: ProjectStatus,
  toStatus: ProjectStatus
): boolean {
  const validTransitions: Record<ProjectStatus, ProjectStatus[]> = {
    created: ['active', 'deleted'],
    active: ['suspended', 'archived', 'deleted'],
    suspended: ['active', 'archived', 'deleted'],
    archived: ['active', 'deleted'],
    deleted: [], // Terminal state
  }

  return validTransitions[fromStatus]?.includes(toStatus) ?? false
}

/**
 * Get the display label for a status
 */
export function getStatusLabel(status: ProjectStatus): string {
  const labels: Record<ProjectStatus, string> = {
    created: 'Created',
    active: 'Active',
    suspended: 'Suspended',
    archived: 'Archived',
    deleted: 'Deleted',
  }

  return labels[status] ?? status
}

/**
 * Get the color for a status (for UI badges)
 */
export function getStatusColor(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    created: 'blue',
    active: 'green',
    suspended: 'red',
    archived: 'yellow',
    deleted: 'gray',
  }

  return colors[status] ?? 'gray'
}
