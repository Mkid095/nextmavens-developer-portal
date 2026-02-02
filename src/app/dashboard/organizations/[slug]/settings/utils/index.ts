/**
 * Organization Settings Utilities
 * Helper functions for role badges, status badges, and toasts
 */

import type { Role } from '../types'
import { ROLE_LABELS } from '../constants'

/**
 * Get role badge color classes
 */
export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'admin':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'developer':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'viewer':
      return 'bg-slate-100 text-slate-800 border-slate-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

/**
 * Get status badge color classes
 */
export function getStatusBadgeColor(status?: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'accepted':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

/**
 * Create a toast notification
 */
export function createToast(
  type: 'success' | 'error',
  message: string
): { id: string; type: 'success' | 'error'; message: string } {
  const id = Math.random().toString(36).substring(7)
  return { id, type, message }
}

/**
 * Check if user can manage members (admin or owner)
 */
export function canManageMembers(userRole?: Role): boolean {
  return userRole === 'owner' || userRole === 'admin'
}

/**
 * Check if user can manage users (owner only)
 */
export function canManageUsers(userRole?: Role): boolean {
  return userRole === 'owner'
}

/**
 * Get role label
 */
export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as Role] || role
}

/**
 * Get role description
 */
export function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    owner: 'Full access to all organization resources and settings',
    admin: 'Can manage projects, services, and API keys',
    developer: 'Can view logs and use services',
    viewer: 'Read-only access to logs and resources',
  }
  return descriptions[role] || ''
}
