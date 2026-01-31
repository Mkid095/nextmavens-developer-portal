/**
 * Service Status Types
 *
 * Defines the service status enum and related types for managing
 * service enablement on the project detail page.
 *
 * US-010: Add Service Status Indicators
 */

/**
 * Service status enum
 * Values: enabled, disabled, provisioning
 *
 * PRD: US-010 - Service status indicators show whether each service
 * (database, auth, storage, realtime, graphql) is enabled, disabled,
 * or currently being provisioned.
 */
export type ServiceStatus = 'enabled' | 'disabled' | 'provisioning'

/**
 * Available service types
 *
 * Each project has these services that can be enabled/disabled:
 * - database: PostgreSQL database with REST/GraphQL APIs
 * - auth: User authentication with JWT tokens
 * - storage: File storage with Telegram/Cloudinary abstraction
 * - realtime: WebSocket subscriptions via CDC
 * - graphql: GraphQL API endpoint
 */
export type ServiceType = 'database' | 'auth' | 'storage' | 'realtime' | 'graphql'

/**
 * Service configuration interface
 *
 * Represents the status and configuration of a single service
 * within a project.
 */
export interface ServiceConfig {
  /** The service type */
  service: ServiceType
  /** Current status of the service */
  status: ServiceStatus
  /** Timestamp when the service was last enabled/disabled */
  lastUpdated?: string
  /** Optional reason for current status */
  statusReason?: string
}

/**
 * Map of all services and their configurations
 */
export type ServicesMap = Record<ServiceType, ServiceConfig>

/**
 * Service status display information
 *
 * UI properties for displaying service status indicators
 */
export interface ServiceStatusDisplay {
  /** Display label for the status */
  label: string
  /** CSS color class for the status indicator */
  colorClass: string
  /** Background color class */
  bgClass: string
  /** Icon component name from lucide-react */
  icon: string
  /** Whether the status can be changed by clicking */
  canToggle: boolean
  /** Tooltip text explaining the status */
  tooltip: string
}

/**
 * Get display information for a service status
 */
export function getServiceStatusDisplay(status: ServiceStatus): ServiceStatusDisplay {
  const displays: Record<ServiceStatus, ServiceStatusDisplay> = {
    enabled: {
      label: 'Enabled',
      colorClass: 'text-emerald-700',
      bgClass: 'bg-emerald-100',
      icon: 'CheckCircle',
      canToggle: true,
      tooltip: 'Service is active and ready to use',
    },
    disabled: {
      label: 'Disabled',
      colorClass: 'text-slate-500',
      bgClass: 'bg-slate-100',
      icon: 'XCircle',
      canToggle: true,
      tooltip: 'Service is disabled. Click to enable.',
    },
    provisioning: {
      label: 'Provisioning',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-100',
      icon: 'Loader2',
      canToggle: false,
      tooltip: 'Service is being provisioned. Please wait...',
    },
  }

  return displays[status] || displays.disabled
}

/**
 * Get the service display label
 */
export function getServiceLabel(service: ServiceType): string {
  const labels: Record<ServiceType, string> = {
    database: 'Database',
    auth: 'Auth',
    storage: 'Storage',
    realtime: 'Realtime',
    graphql: 'GraphQL',
  }

  return labels[service] || service
}

/**
 * Default service configurations for a new project
 *
 * All services are enabled by default for new projects
 */
export const DEFAULT_SERVICE_CONFIGS: ServicesMap = {
  database: {
    service: 'database',
    status: 'enabled',
    lastUpdated: new Date().toISOString(),
  },
  auth: {
    service: 'auth',
    status: 'enabled',
    lastUpdated: new Date().toISOString(),
  },
  storage: {
    service: 'storage',
    status: 'enabled',
    lastUpdated: new Date().toISOString(),
  },
  realtime: {
    service: 'realtime',
    status: 'enabled',
    lastUpdated: new Date().toISOString(),
  },
  graphql: {
    service: 'graphql',
    status: 'enabled',
    lastUpdated: new Date().toISOString(),
  },
}

/**
 * Check if a service status can be toggled
 */
export function canToggleServiceStatus(status: ServiceStatus): boolean {
  return getServiceStatusDisplay(status).canToggle
}

/**
 * Get the opposite status for a toggle action
 *
 * When toggling, enabled <-> disabled
 * Provisioning cannot be toggled
 */
export function getToggledStatus(currentStatus: ServiceStatus): ServiceStatus | null {
  if (!canToggleServiceStatus(currentStatus)) {
    return null
  }

  return currentStatus === 'enabled' ? 'disabled' : 'enabled'
}
