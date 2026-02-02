/**
 * Abuse Dashboard - Utility Functions
 */

import { SEVERITY_COLORS } from './constants'

/**
 * Format cap type for display
 */
export function formatCapType(capType: string): string {
  return capType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format pattern type for display
 */
export function formatPatternType(patternType: string): string {
  return patternType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get severity color classes
 */
export function getSeverityColor(severity: string): string {
  const colors = SEVERITY_COLORS[severity] || SEVERITY_COLORS.default
  return `${colors.text} ${colors.bg}`
}
