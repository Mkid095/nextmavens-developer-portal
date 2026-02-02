/**
 * Admin Session Database Layer
 * @deprecated Re-exports from admin-database module for backward compatibility
 * Import from './admin-database' instead
 *
 * Database functions for managing admin sessions and actions.
 * Provides CRUD operations for break glass session management.
 *
 * US-003: Implement Break Glass Authentication
 */

export * from './admin-database/types'
export { createAdminSession, validateAdminSession, cleanupExpiredSessions } from './admin-database/sessions'
export { logAdminAction } from './admin-database/actions'
export { getAdminSession, getSessionActions, getAdminSessions, getTargetActionHistory } from './admin-database/queries'
