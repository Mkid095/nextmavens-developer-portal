/**
 * Project Lifecycle Types
 *
 * Defines the project status states and their associated behaviors.
 * This is the single source of truth for how projects behave in each state.
 *
 * PRD: US-002 from prd-project-lifecycle.json
 */

/**
 * Project lifecycle states
 * Each state represents a phase in the project's journey from creation to deletion
 */
export enum ProjectLifecycleStatus {
  /** Initial state - Project provisioned but not yet activated */
  CREATED = 'created',
  /** Normal operating state - All services fully functional */
  ACTIVE = 'active',
  /** Temporarily disabled - Usually due to abuse or quota violations */
  SUSPENDED = 'suspended',
  /** Long-term inactive - Services disabled but data preserved */
  ARCHIVED = 'archived',
  /** Marked for deletion - In grace period before permanent removal */
  DELETED = 'deleted',
}

/**
 * State behavior configuration
 * Defines what capabilities are available in each project state
 */
export interface StateBehavior {
  /** Can API keys be used to authenticate requests */
  keysWork: boolean
  /** Are services (database, auth, storage, realtime) accessible */
  servicesActive: boolean
  /** Level of data access available */
  dataAccess: 'full' | 'readonly' | 'none'
  /** Description of this state for UI/UX */
  description: string
}

/**
 * State behaviors mapping
 * This is the canonical definition of what each state means
 *
 * CREATED:
 * - Keys work: Yes (for testing and initial setup)
 * - Services active: Yes
 * - Data access: Full
 * - Purpose: Project is provisioned and ready for activation
 *
 * ACTIVE:
 * - Keys work: Yes
 * - Services active: Yes
 * - Data access: Full
 * - Purpose: Normal operating state
 *
 * SUSPENDED:
 * - Keys work: No (all requests rejected with PROJECT_SUSPENDED error)
 * - Services active: No
 * - Data access: Read-only (for admin access)
 * - Purpose: Temporary suspension due to abuse, quota violations, or manual action
 *
 * ARCHIVED:
 * - Keys work: No (all requests rejected with PROJECT_ARCHIVED error)
 * - Services active: No
 * - Data access: Read-only (for admin access)
 * - Purpose: Long-term storage for inactive projects to reduce costs
 *
 * DELETED:
 * - Keys work: No (all requests rejected with PROJECT_DELETED error)
 * - Services active: No
 * - Data access: None (scheduled for permanent deletion after grace period)
 * - Purpose: Soft delete state before permanent data removal
 */
export const STATE_BEHAVIORS: Record<ProjectLifecycleStatus, StateBehavior> = {
  [ProjectLifecycleStatus.CREATED]: {
    keysWork: true,
    servicesActive: true,
    dataAccess: 'full',
    description: 'Project is provisioned and ready to be activated',
  },
  [ProjectLifecycleStatus.ACTIVE]: {
    keysWork: true,
    servicesActive: true,
    dataAccess: 'full',
    description: 'Project is fully operational',
  },
  [ProjectLifecycleStatus.SUSPENDED]: {
    keysWork: false,
    servicesActive: false,
    dataAccess: 'readonly',
    description: 'Project is temporarily suspended due to quota violations or abuse',
  },
  [ProjectLifecycleStatus.ARCHIVED]: {
    keysWork: false,
    servicesActive: false,
    dataAccess: 'readonly',
    description: 'Project is archived and inactive',
  },
  [ProjectLifecycleStatus.DELETED]: {
    keysWork: false,
    servicesActive: false,
    dataAccess: 'none',
    description: 'Project is marked for deletion',
  },
}

/**
 * Valid state transitions
 * Defines which state changes are allowed
 *
 * Valid transitions:
 * - CREATED → ACTIVE (activation)
 * - CREATED → DELETED (cancellation)
 * - ACTIVE → SUSPENDED (suspension)
 * - ACTIVE → ARCHIVED (archiving)
 * - ACTIVE → DELETED (deletion)
 * - SUSPENDED → ACTIVE (unsuspension/reinstatement)
 * - SUSPENDED → DELETED (deletion while suspended)
 * - ARCHIVED → ACTIVE (reactivation)
 * - ARCHIVED → DELETED (deletion while archived)
 *
 * Invalid transitions:
 * - SUSPENDED → CREATED (cannot go back to created)
 * - ARCHIVED → CREATED (cannot go back to created)
 * - DELETED → * (terminal state, no exits)
 */
export const VALID_TRANSITIONS: Record<ProjectLifecycleStatus, ProjectLifecycleStatus[]> = {
  [ProjectLifecycleStatus.CREATED]: [
    ProjectLifecycleStatus.ACTIVE,
    ProjectLifecycleStatus.DELETED,
  ],
  [ProjectLifecycleStatus.ACTIVE]: [
    ProjectLifecycleStatus.SUSPENDED,
    ProjectLifecycleStatus.ARCHIVED,
    ProjectLifecycleStatus.DELETED,
  ],
  [ProjectLifecycleStatus.SUSPENDED]: [
    ProjectLifecycleStatus.ACTIVE,
    ProjectLifecycleStatus.DELETED,
  ],
  [ProjectLifecycleStatus.ARCHIVED]: [
    ProjectLifecycleStatus.ACTIVE,
    ProjectLifecycleStatus.DELETED,
  ],
  [ProjectLifecycleStatus.DELETED]: [], // Terminal state
}

/**
 * Check if a state transition is valid
 */
export function isValidTransition(
  fromStatus: ProjectLifecycleStatus,
  toStatus: ProjectLifecycleStatus
): boolean {
  return VALID_TRANSITIONS[fromStatus].includes(toStatus)
}

/**
 * Get behavior configuration for a given status
 */
export function getStateBehavior(status: ProjectLifecycleStatus): StateBehavior {
  return STATE_BEHAVIORS[status]
}

/**
 * Check if API keys work in the given state
 */
export function keysWorkInState(status: ProjectLifecycleStatus): boolean {
  return STATE_BEHAVIORS[status].keysWork
}

/**
 * Check if services are active in the given state
 */
export function servicesActiveInState(status: ProjectLifecycleStatus): boolean {
  return STATE_BEHAVIORS[status].servicesActive
}

/**
 * Get data access level for the given state
 */
export function getDataAccessLevel(status: ProjectLifecycleStatus): 'full' | 'readonly' | 'none' {
  return STATE_BEHAVIORS[status].dataAccess
}

/**
 * Error codes returned for non-active states
 */
export enum ProjectStatusError {
  /** Project is suspended - keys don't work */
  PROJECT_SUSPENDED = 'PROJECT_SUSPENDED',
  /** Project is archived - keys don't work */
  PROJECT_ARCHIVED = 'PROJECT_ARCHIVED',
  /** Project is deleted - keys don't work */
  PROJECT_DELETED = 'PROJECT_DELETED',
  /** Invalid state transition requested */
  INVALID_TRANSITION = 'INVALID_TRANSITION',
}

/**
 * Get the error code for requests made to a project in a non-active state
 */
export function getStatusErrorCode(status: ProjectLifecycleStatus): ProjectStatusError | null {
  switch (status) {
    case ProjectLifecycleStatus.SUSPENDED:
      return ProjectStatusError.PROJECT_SUSPENDED
    case ProjectLifecycleStatus.ARCHIVED:
      return ProjectStatusError.PROJECT_ARCHIVED
    case ProjectLifecycleStatus.DELETED:
      return ProjectStatusError.PROJECT_DELETED
    case ProjectLifecycleStatus.CREATED:
    case ProjectLifecycleStatus.ACTIVE:
      return null // No error for these states
  }
}

/**
 * Status display information for UI
 */
export interface StatusDisplayInfo {
  /** Display label for the status */
  label: string
  /** Color class for status badges */
  color: string
  /** Icon component name (lucide-react) */
  icon: string
}

/**
 * UI display configuration for each status
 */
export const STATUS_DISPLAY: Record<ProjectLifecycleStatus, StatusDisplayInfo> = {
  [ProjectLifecycleStatus.CREATED]: {
    label: 'Created',
    color: 'blue',
    icon: 'PlusCircle',
  },
  [ProjectLifecycleStatus.ACTIVE]: {
    label: 'Active',
    color: 'green',
    icon: 'CheckCircle',
  },
  [ProjectLifecycleStatus.SUSPENDED]: {
    label: 'Suspended',
    color: 'red',
    icon: 'XCircle',
  },
  [ProjectLifecycleStatus.ARCHIVED]: {
    label: 'Archived',
    color: 'yellow',
    icon: 'Archive',
  },
  [ProjectLifecycleStatus.DELETED]: {
    label: 'Deleted',
    color: 'gray',
    icon: 'Trash2',
  },
}
