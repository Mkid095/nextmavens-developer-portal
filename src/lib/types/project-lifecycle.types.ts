/**
 * Project Lifecycle State Behaviors
 *
 * This module defines the behaviors and permissions for each project state.
 * These behaviors are enforced throughout the system including API gateway,
 * services, and data access layers.
 *
 * Project Lifecycle: CREATED → ACTIVE → SUSPENDED → ARCHIVED → DELETED
 *
 * @see docs/prd-project-lifecycle.json US-002: Define State Behaviors
 */

/**
 * Project status enum representing all lifecycle states
 */
export enum ProjectStatus {
  /** Initial state after project creation */
  CREATED = 'created',
  /** Project is fully operational */
  ACTIVE = 'active',
  /** Project temporarily suspended due to abuse, limits, or manual action */
  SUSPENDED = 'suspended',
  /** Project permanently archived - read-only access */
  ARCHIVED = 'archived',
  /** Project marked for deletion - pending grace period */
  DELETED = 'deleted',
}

/**
 * State behavior definition
 * Defines what actions are allowed in each project state
 */
export interface StateBehavior {
  /** Whether API keys work for authentication */
  keysWork: boolean
  /** Whether services are active and operational */
  servicesActive: boolean
  /** Data access level */
  dataAccess: DataAccessLevel
  /** Whether new API keys can be created */
  canCreateKeys: boolean
  /** Whether project settings can be modified */
  canModifySettings: boolean
  /** Description of the state */
  description: string
  /** Error code to return if requests are blocked */
  errorCode?: string
}

/**
 * Data access levels for project states
 */
export enum DataAccessLevel {
  /** Full read/write access to data */
  FULL = 'full',
  /** Read-only access to data */
  READ_ONLY = 'read_only',
  /** No access to data */
  NONE = 'none',
}

/**
 * Error codes returned when project is not in active state
 */
export enum ProjectStateError {
  /** Project is suspended */
  PROJECT_SUSPENDED = 'PROJECT_SUSPENDED',
  /** Project is archived */
  PROJECT_ARCHIVED = 'PROJECT_ARCHIVED',
  /** Project is deleted */
  PROJECT_DELETED = 'PROJECT_DELETED',
  /** Project is not yet activated */
  PROJECT_NOT_ACTIVE = 'PROJECT_NOT_ACTIVE',
}

/**
 * State behaviors map
 * Defines the complete behavior specification for each project state
 *
 * CREATED: Initial state, full access during provisioning
 * - Keys work for authentication
 * - Services are active
 * - Full data access (read/write)
 * - Can create new keys
 * - Can modify settings
 * - Transitions to ACTIVE after provisioning completes
 */
export const STATE_BEHAVIORS: Record<ProjectStatus, StateBehavior> = {
  [ProjectStatus.CREATED]: {
    keysWork: true,
    servicesActive: true,
    dataAccess: DataAccessLevel.FULL,
    canCreateKeys: true,
    canModifySettings: true,
    description: 'Project is created and provisioning. Full access during initialization.',
  },

  /**
   * ACTIVE: Normal operational state
   * - Keys work for authentication
   * - Services are active
   * - Full data access (read/write)
   * - Can create new keys
   * - Can modify settings
   * - Transitions to SUSPENDED (manual/automatic) or ARCHIVED
   */
  [ProjectStatus.ACTIVE]: {
    keysWork: true,
    servicesActive: true,
    dataAccess: DataAccessLevel.FULL,
    canCreateKeys: true,
    canModifySettings: true,
    description: 'Project is active and fully operational.',
  },

  /**
   * SUSPENDED: Temporary suspension state
   * - Keys do NOT work for authentication
   * - Services are DISABLED
   * - Data is read-only (can export, but not modify)
   * - CANNOT create new keys
   * - CANNOT modify settings (except reactivation)
   * - Returns PROJECT_SUSPENDED error on API requests
   * - Transitions back to ACTIVE (manual) or to ARCHIVED
   */
  [ProjectStatus.SUSPENDED]: {
    keysWork: false,
    servicesActive: false,
    dataAccess: DataAccessLevel.READ_ONLY,
    canCreateKeys: false,
    canModifySettings: false,
    description: 'Project is suspended. API keys are disabled and services are stopped.',
    errorCode: ProjectStateError.PROJECT_SUSPENDED,
  },

  /**
   * ARCHIVED: Permanent read-only state
   * - Keys do NOT work for authentication
   * - Services are DISABLED
   * - Data is read-only (can export, but not modify)
   * - CANNOT create new keys
   * - CANNOT modify settings (except reactivation/restore)
   * - Returns PROJECT_ARCHIVED error on API requests
   * - Typically irreversible (except admin restore)
   */
  [ProjectStatus.ARCHIVED]: {
    keysWork: false,
    servicesActive: false,
    dataAccess: DataAccessLevel.READ_ONLY,
    canCreateKeys: false,
    canModifySettings: false,
    description: 'Project is archived. Data is read-only and services are disabled.',
    errorCode: ProjectStateError.PROJECT_ARCHIVED,
  },

  /**
   * DELETED: Pending deletion state
   * - Keys do NOT work for authentication
   * - Services are DISABLED
   * - Data access is NONE (or read-only during grace period)
   * - CANNOT create new keys
   * - CANNOT modify settings
   * - Returns PROJECT_DELETED error on API requests
   * - Data permanently deleted after grace period
   */
  [ProjectStatus.DELETED]: {
    keysWork: false,
    servicesActive: false,
    dataAccess: DataAccessLevel.NONE,
    canCreateKeys: false,
    canModifySettings: false,
    description: 'Project is deleted and pending permanent removal.',
    errorCode: ProjectStateError.PROJECT_DELETED,
  },
} as const

/**
 * Valid state transitions
 * Defines which state transitions are allowed
 */
export const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.CREATED]: [ProjectStatus.ACTIVE, ProjectStatus.DELETED],
  [ProjectStatus.ACTIVE]: [ProjectStatus.SUSPENDED, ProjectStatus.ARCHIVED, ProjectStatus.DELETED],
  [ProjectStatus.SUSPENDED]: [ProjectStatus.ACTIVE, ProjectStatus.ARCHIVED, ProjectStatus.DELETED],
  [ProjectStatus.ARCHIVED]: [], // Typically irreversible without admin intervention
  [ProjectStatus.DELETED]: [], // Terminal state
} as const

/**
 * Check if a state transition is valid
 */
export function isValidTransition(
  fromStatus: ProjectStatus,
  toStatus: ProjectStatus
): boolean {
  return VALID_TRANSITIONS[fromStatus].includes(toStatus)
}

/**
 * Get state behavior for a given status
 */
export function getStateBehavior(status: ProjectStatus): StateBehavior {
  return STATE_BEHAVIORS[status]
}

/**
 * Check if API keys work for a given status
 */
export function keysWorkForStatus(status: ProjectStatus): boolean {
  return STATE_BEHAVIORS[status].keysWork
}

/**
 * Check if services are active for a given status
 */
export function servicesActiveForStatus(status: ProjectStatus): boolean {
  return STATE_BEHAVIORS[status].servicesActive
}

/**
 * Get data access level for a given status
 */
export function getDataAccessLevel(status: ProjectStatus): DataAccessLevel {
  return STATE_BEHAVIORS[status].dataAccess
}

/**
 * Check if new keys can be created for a given status
 */
export function canCreateKeysForStatus(status: ProjectStatus): boolean {
  return STATE_BEHAVIORS[status].canCreateKeys
}

/**
 * Check if settings can be modified for a given status
 */
export function canModifySettingsForStatus(status: ProjectStatus): boolean {
  return STATE_BEHAVIORS[status].canModifySettings
}

/**
 * Get error code for a non-active status (if any)
 */
export function getErrorCodeForStatus(status: ProjectStatus): ProjectStateError | undefined {
  return STATE_BEHAVIORS[status].errorCode
}

/**
 * Check if a status allows write access to data
 */
export function allowsWriteAccess(status: ProjectStatus): boolean {
  return getDataAccessLevel(status) === DataAccessLevel.FULL
}

/**
 * Check if a status allows any data access
 */
export function allowsAnyDataAccess(status: ProjectStatus): boolean {
  const level = getDataAccessLevel(status)
  return level === DataAccessLevel.FULL || level === DataAccessLevel.READ_ONLY
}
