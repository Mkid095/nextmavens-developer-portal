/**
 * Traces Page Utilities
 * Utility functions for traces page
 */

import { Activity } from 'lucide-react'
import type { ServiceDuration } from './types'
import { SERVICE_ICONS } from './constants'

/**
 * Format duration for display
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number | null): string {
  if (ms === null) return 'N/A'
  if (ms < 1) return '< 1ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Format date for display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Get service icon component
 * @param serviceName - Name of the service
 * @returns Icon component
 */
export function getServiceIcon(serviceName: string): React.ElementType {
  return SERVICE_ICONS[serviceName] || Activity
}

/**
 * Calculate service durations (estimated)
 * Since we only have total duration, we estimate per service
 * @param services - Array of service names
 * @param totalDuration - Total duration in milliseconds
 * @returns Array of service durations
 */
export function calculateServiceDurations(
  services: string[],
  totalDuration: number | null
): ServiceDuration[] {
  if (totalDuration === null || services.length === 0) return []

  // Estimate: divide total duration evenly across services
  // In a real implementation, each service would log its own duration
  const perServiceDuration = totalDuration / services.length

  let accumulatedTime = 0
  return services.map((service, index) => {
    const duration =
      index === services.length - 1
        ? totalDuration - accumulatedTime
        : perServiceDuration

    accumulatedTime += duration

    return {
      service,
      duration: Math.round(duration),
      startTime: Math.round(accumulatedTime - duration),
      endTime: Math.round(accumulatedTime),
    }
  })
}
