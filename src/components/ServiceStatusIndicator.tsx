'use client'

import { Loader2, CheckCircle, XCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import type { ServiceStatus, ServiceType } from '@/lib/types/service-status.types'
import { getServiceStatusDisplay, getServiceLabel, canToggleServiceStatus } from '@/lib/types/service-status.types'

/**
 * Re-export ServiceStatus and ServiceType for convenience
 */
export type { ServiceStatus, ServiceType } from '@/lib/types/service-status.types'

/**
 * Service toggle callback type
 */
export type ServiceToggleCallback = (service: ServiceType, newStatus: ServiceStatus) => Promise<void> | void

interface ServiceStatusIndicatorProps {
  /**
   * The current status of the service
   */
  status: ServiceStatus

  /**
   * Optional callback when the status indicator is clicked
   * Used to toggle service on/off
   */
  onToggle?: () => void

  /**
   * Whether the status is currently being updated
   */
  isUpdating?: boolean

  /**
   * The name of the service for accessibility
   */
  serviceName: string
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
  status,
  onToggle,
  isUpdating = false,
  serviceName,
}: ServiceStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'enabled':
        return {
          icon: CheckCircle,
          label: 'Enabled',
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-700',
          iconColor: 'text-emerald-600',
          borderColor: 'border-emerald-200',
          cursor: onToggle ? 'cursor-pointer' : 'cursor-default',
        }
      case 'disabled':
        return {
          icon: XCircle,
          label: 'Disabled',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          cursor: onToggle ? 'cursor-pointer' : 'cursor-default',
        }
      case 'provisioning':
        return {
          icon: Loader2,
          label: 'Provisioning',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          iconColor: 'text-amber-600',
          borderColor: 'border-amber-200',
          cursor: 'cursor-default',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const handleClick = () => {
    if (onToggle && !isUpdating && status !== 'provisioning') {
      onToggle()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!onToggle || isUpdating || status === 'provisioning'}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${config.cursor} transition hover:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed`}
      title={
        status === 'provisioning'
          ? `${serviceName} is being provisioned`
          : onToggle
            ? `Click to ${status === 'enabled' ? 'disable' : 'enable'} ${serviceName}`
            : `${serviceName} is ${config.label.toLowerCase()}`
      }
      aria-label={`${serviceName} status: ${config.label}`}
    >
      <Icon className={`w-4 h-4 ${status === 'provisioning' ? 'animate-spin' : ''} ${config.iconColor}`} />
      <span className="text-sm font-medium">{config.label}</span>
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
