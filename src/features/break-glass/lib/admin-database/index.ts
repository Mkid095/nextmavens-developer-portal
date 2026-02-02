/**
 * Admin Database Module
 *
 * Database functions for managing admin sessions and actions.
 * Provides CRUD operations for break glass session management.
 *
 * US-003: Implement Break Glass Authentication
 */

export * from './types'
export { createAdminSession, validateAdminSession, cleanupExpiredSessions } from './sessions'
export { logAdminAction } from './actions'
export { getAdminSession, getSessionActions, getAdminSessions, getTargetActionHistory } from './queries'
