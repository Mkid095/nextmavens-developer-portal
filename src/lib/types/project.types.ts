/**
 * Project Lifecycle Types
 *
 * Defines the project status enum and related types for project lifecycle management.
 * PRD: US-001, US-002 from prd-project-lifecycle.json
 *
 * US-002: Define State Behaviors
 * - CREATED: Keys work, services active, data access full
 * - ACTIVE: Keys work, services active, data access full
 * - SUSPENDED: Keys don't work, services disabled, data read-only
 * - ARCHIVED: Keys don't work, services disabled, data read-only
 * - DELETED: Keys don't work, services disabled, data deleted (after grace)
 */

/**
 * Project status enum matching the database schema
 * Values: created, active, suspended, archived, deleted
 *
 * PRD: US-001 - Add Project Status Column
 * PRD: US-002 - Define State Behaviors
 */
export type ProjectStatus =
  | 'created'
  | 'active'
  | 'suspended'
  | 'archived'
  | 'deleted'

/**
 * Project status behaviors interface
 *
 * Defines the service availability and data access level for each project state.
 * This type ensures type-safe access to state-specific behaviors.
 *
 * PRD: US-002 - Define State Behaviors
 *
 * @example
 * ```typescript
 * const behaviors: ProjectStatusBehaviorMap = {
 *   created: { keys_work: true, services_active: true, data_access: 'full' },
 *   active: { keys_work: true, services_active: true, data_access: 'full' },
 *   suspended: { keys_work: false, services_active: false, data_access: 'read_only' },
 *   archived: { keys_work: false, services_active: false, data_access: 'read_only' },
 *   deleted: { keys_work: false, services_active: false, data_access: 'none' },
 * }
 * ```
 */
export interface ProjectStatusBehavior {
  /** Whether API keys function in this state */
  keys_work: boolean
  /** Whether platform services (auth, realtime, storage) are active */
  services_active: boolean
  /** Data access level: 'full', 'read_only', or 'none' */
  data_access: 'full' | 'read_only' | 'none'
}

/**
 * Type mapping each project status to its specific behavior
 *
 * PRD: US-002 - Define State Behaviors
 * Documents what services are available in each state
 */
export interface ProjectStatusBehaviors {
  /** CREATED: Initial state after provisioning. Keys work, services active, data access full. */
  created: ProjectStatusBehavior
  /** ACTIVE: Normal operating state. Keys work, services active, data access full. */
  active: ProjectStatusBehavior
  /** SUSPENDED: Abuse detected or limits exceeded. Keys don't work, services disabled, data read-only. */
  suspended: ProjectStatusBehavior
  /** ARCHIVED: User archived. Keys don't work, services disabled, data read-only. */
  archived: ProjectStatusBehavior
  /** DELETED: Soft deleted. Keys don't work, services disabled, data deleted after grace period. */
  deleted: ProjectStatusBehavior
}

/**
 * Complete behavior map for all project statuses
 *
 * PRD: US-002 - Define State Behaviors
 *
 * This map provides the authoritative source of truth for how each project state
 * should behave across the platform. Gateway enforcement, service enablement,
 * and access control should reference this map.
 *
 * Behaviors defined per PRD US-002:
 * - CREATED: Keys work, services active, data access full
 * - ACTIVE: Keys work, services active, data access full
 * - SUSPENDED: Keys don't work, services disabled, data read-only
 * - ARCHIVED: Keys don't work, services disabled, data read-only
 * - DELETED: Keys don't work, services disabled, data deleted (after grace)
 */
export const PROJECT_STATUS_BEHAVIORS: ProjectStatusBehaviors = {
  // CREATED: Initial state after provisioning, keys work, services active
  created: {
    keys_work: true,
    services_active: true,
    data_access: 'full',
  },
  // ACTIVE: Normal operating state, keys work, services active
  active: {
    keys_work: true,
    services_active: true,
    data_access: 'full',
  },
  // SUSPENDED: Abuse detected or limits exceeded, keys don't work, services disabled, data read-only
  suspended: {
    keys_work: false,
    services_active: false,
    data_access: 'read_only',
  },
  // ARCHIVED: User archived, keys don't work, services disabled, data read-only
  archived: {
    keys_work: false,
    services_active: false,
    data_access: 'read_only',
  },
  // DELETED: Soft deleted, keys don't work, services disabled, data to be deleted after grace period
  deleted: {
    keys_work: false,
    services_active: false,
    data_access: 'none',
  },
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

/**
 * Get the behavior configuration for a given project status
 *
 * PRD: US-002 - Define State Behaviors
 *
 * This function provides runtime access to the documented state behaviors.
 * Use this to check whether keys work, services are active, or what data
 * access level is available for a given project status.
 *
 * @param status - The project status to get behaviors for
 * @returns The behavior configuration for the status
 *
 * @example
 * ```typescript
 * const behavior = getStatusBehavior('suspended')
 * console.log(behavior.keys_work) // false
 * console.log(behavior.services_active) // false
 * console.log(behavior.data_access) // 'read_only'
 * ```
 */
export function getStatusBehavior(status: ProjectStatus): ProjectStatusBehavior {
  return PROJECT_STATUS_BEHAVIORS[status]
}

/**
 * Check if API keys work for a given project status
 *
 * PRD: US-002 - Define State Behaviors
 *
 * @param status - The project status to check
 * @returns true if keys work in this state, false otherwise
 */
export function doKeysWork(status: ProjectStatus): boolean {
  return PROJECT_STATUS_BEHAVIORS[status].keys_work
}

/**
 * Check if services are active for a given project status
 *
 * PRD: US-002 - Define State Behaviors
 *
 * @param status - The project status to check
 * @returns true if services are active in this state, false otherwise
 */
export function areServicesActive(status: ProjectStatus): boolean {
  return PROJECT_STATUS_BEHAVIORS[status].services_active
}

/**
 * Get the data access level for a given project status
 *
 * PRD: US-002 - Define State Behaviors
 *
 * @param status - The project status to check
 * @returns The data access level: 'full', 'read_only', or 'none'
 */
export function getDataAccessLevel(status: ProjectStatus): 'full' | 'read_only' | 'none' {
  return PROJECT_STATUS_BEHAVIORS[status].data_access
}
