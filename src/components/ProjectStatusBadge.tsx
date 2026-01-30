'use client'

import { CheckCircle, XCircle, Archive, Clock, LucideIcon } from 'lucide-react'
import { ProjectStatus, STATE_BEHAVIORS } from '@/lib/types/project-lifecycle.types'

/**
 * Project status badge configuration
 */
interface StatusConfig {
  label: string
  bgColor: string
  textColor: string
  icon: LucideIcon
  description: string
}

/**
 * Status configurations for each project state
 * Color-coded: Active (green), Suspended (red), Archived (yellow), Created (blue), Deleted (gray)
 */
const STATUS_CONFIGS: Record<ProjectStatus, StatusConfig> = {
  [ProjectStatus.CREATED]: {
    label: 'Created',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: Clock,
    description: 'Project is being provisioned. Full access during initialization.',
  },
  [ProjectStatus.ACTIVE]: {
    label: 'Active',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: CheckCircle,
    description: 'Project is active and fully operational.',
  },
  [ProjectStatus.SUSPENDED]: {
    label: 'Suspended',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: XCircle,
    description: 'Project is suspended. API keys are disabled and services are stopped.',
  },
  [ProjectStatus.ARCHIVED]: {
    label: 'Archived',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    icon: Archive,
    description: 'Project is archived. Data is read-only and services are disabled.',
  },
  [ProjectStatus.DELETED]: {
    label: 'Deleted',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: XCircle,
    description: 'Project is deleted and pending permanent removal.',
  },
}

/**
 * Props for ProjectStatusBadge component
 */
interface ProjectStatusBadgeProps {
  /** The project status */
  status: ProjectStatus | string
  /** Optional CSS class name */
  className?: string
  /** Whether to show the icon */
  showIcon?: boolean
  /** Whether to show tooltip on hover */
  showTooltip?: boolean
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Normalize status string to ProjectStatus enum
 */
function normalizeStatus(status: string | ProjectStatus): ProjectStatus {
  if (Object.values(ProjectStatus).includes(status as ProjectStatus)) {
    return status as ProjectStatus
  }
  // Default to CREATED for unknown statuses
  return ProjectStatus.CREATED
}

/**
 * ProjectStatusBadge Component
 *
 * Displays a color-coded badge indicating the project's lifecycle status.
 *
 * US-008: Create Status Badge UI
 * - Status badge on project detail page
 * - Status badge in project list
 * - Color-coded: Active (green), Suspended (red), Archived (yellow), Created (blue), Deleted (gray)
 * - Status explanation on hover
 *
 * @see docs/prd-project-lifecycle.json US-008
 */
export default function ProjectStatusBadge({
  status,
  className = '',
  showIcon = true,
  showTooltip = true,
  size = 'md',
}: ProjectStatusBadgeProps) {
  const normalizedStatus = normalizeStatus(status)
  const config = STATUS_CONFIGS[normalizedStatus]
  const Icon = config.icon

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  }

  // Icon sizes
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const badge = (
    <div
      className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses[size]} ${className}`}
      title={showTooltip ? config.description : undefined}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
    </div>
  )

  return badge
}

/**
 * Get status configuration for a given status
 */
export function getStatusConfig(status: ProjectStatus | string): StatusConfig {
  const normalizedStatus = normalizeStatus(status)
  return STATUS_CONFIGS[normalizedStatus]
}

/**
 * Get status description for a given status
 */
export function getStatusDescription(status: ProjectStatus | string): string {
  return getStatusConfig(status).description
}
