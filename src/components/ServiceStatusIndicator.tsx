'use client'

import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import type { ServiceStatus, ServiceType } from '@/lib/types/service-status.types'
import { getServiceStatusDisplay, getServiceLabel } from '@/lib/types/service-status.types'

/**
 * Re-export ServiceStatus and ServiceType for convenience
 */
export type { ServiceStatus, ServiceType } from '@/lib/types/service-status.types'

interface ServiceStatusIndicatorProps {
  /**
   * The service type (database, auth, storage, realtime, graphql)
   */
  service: ServiceType

  /**
   * The current status of the service
   */
  status: ServiceStatus

  /**
   * Optional callback when the status indicator is clicked
   * Used to toggle service on/off
   */
  onToggle?: () => void | Promise<void>

  /**
   * Whether the status is currently being updated
   */
  isUpdating?: boolean
}

/**
 * ServiceStatusIndicator Component
 *
 * Displays a visual indicator of a service's status with:
 * - Green checkmark for Enabled
 * - Red X for Disabled
 * - Yellow clock for Provisioning
 *
 * Can be clicked to toggle service status when onToggle is provided.
 *
 * US-010: Add Service Status Indicators
 */
export default function ServiceStatusIndicator({
  service,
  status,
  onToggle,
  isUpdating = false,
}: ServiceStatusIndicatorProps) {
  const display = getServiceStatusDisplay(status)
  const serviceLabel = getServiceLabel(service)

  const handleClick = () => {
    if (onToggle && !isUpdating && display.canToggle) {
      onToggle()
    }
  }

  const Icon = status === 'provisioning' ? Loader2 : status === 'enabled' ? CheckCircle : XCircle

  return (
    <button
      onClick={handleClick}
      disabled={!onToggle || isUpdating || !display.canToggle}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${display.bgClass} ${display.colorClass} border-opacity-20 transition hover:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed`}
      title={onToggle && display.canToggle ? `Click to ${status === 'enabled' ? 'disable' : 'enable'} ${serviceLabel}` : display.tooltip}
      aria-label={`${serviceLabel} status: ${display.label}`}
    >
      <Icon className={`w-4 h-4 ${status === 'provisioning' ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">{display.label}</span>
    </button>
  )
}

/**
 * Helper function to determine service status based on project status and service-specific state
 */
export function getServiceStatus(
  projectStatus: string,
  serviceEnabled: boolean = true
): ServiceStatus {
  // If project is suspended or archived, services are disabled
  if (projectStatus === 'suspended' || projectStatus === 'archived') {
    return 'disabled'
  }

  // Otherwise, use the service-specific enabled state
  return serviceEnabled ? 'enabled' : 'disabled'
}
