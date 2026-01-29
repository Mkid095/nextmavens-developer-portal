/**
 * Studio API Helpers
 * Utility functions for Studio API operations
 */

import type { EndUser, EndUserSession } from '@/lib/types/auth-user.types'

/**
 * Format a date for display
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return 'Never'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return formatDate(dateString)
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: EndUser): string {
  return user.name || user.email
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(user: EndUser): string {
  if (user.name) {
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }
  return user.email.substring(0, 2).toUpperCase()
}

/**
 * Check if a session is active (not revoked and recent activity)
 */
export function isSessionActive(session: EndUserSession): boolean {
  if (session.is_revoked) return false

  const lastActivity = new Date(session.last_activity_at)
  const now = new Date()
  const diffDays = (now.getTime() - lastActivity.getTime()) / 86400000

  // Consider session active if activity within last 30 days
  return diffDays < 30
}

/**
 * Get session device display name
 */
export function getSessionDeviceName(session: EndUserSession): string {
  const parts = []

  if (session.browser) {
    parts.push(session.browser)
  }

  if (session.device_type) {
    parts.push(session.device_type)
  }

  if (session.device_name) {
    parts.push(session.device_name)
  }

  return parts.length > 0 ? parts.join(' - ') : 'Unknown Device'
}

/**
 * Get session location display
 */
export function getSessionLocation(session: EndUserSession): string {
  if (session.location) {
    return session.location
  }

  if (session.ip_address) {
    return session.ip_address
  }

  return 'Unknown Location'
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}
