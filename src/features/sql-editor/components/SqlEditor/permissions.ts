/**
 * SQL Editor Permission Utilities
 */

import type { UserRole } from './types'
import { extractSqlCommand } from './utils'

export function canDisableReadonly(userRole: UserRole): boolean {
  return userRole === 'admin' || userRole === 'owner' || userRole === 'developer'
}

/**
 * US-011: Check if a query type is allowed for the current user role
 */
export function isQueryTypeAllowed(queryText: string, userRole: UserRole): boolean {
  const command = extractSqlCommand(queryText)

  if (!userRole) {
    return false
  }

  // Viewers can only SELECT
  if (userRole === 'viewer') {
    return command === 'SELECT'
  }

  // Developers can SELECT, INSERT, UPDATE
  if (userRole === 'developer') {
    return ['SELECT', 'INSERT', 'UPDATE'].includes(command)
  }

  // Admins and Owners can do everything
  return true
}
