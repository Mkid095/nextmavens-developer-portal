/**
 * Organization Detail Page - Utility Functions
 */

import type { UserRole, ProjectStatus } from './types'

/**
 * Get badge color classes for user role
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
 * Get badge color classes for project status
 */
export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'suspended':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'archived':
      return 'bg-slate-100 text-slate-800 border-slate-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

/**
 * Format date to locale string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

/**
 * Generate a unique toast ID
 */
export function generateToastId(): string {
  return Math.random().toString(36).substring(7)
}
