/**
 * Access Project Service
 * @deprecated Re-exports from access-project module for backward compatibility
 * Import from './access-project' instead
 *
 * Service layer for the access project break glass power.
 * Allows platform operators to access ANY project details, bypassing normal
 * ownership checks for investigation purposes.
 *
 * US-008: Implement Access Any Project Power
 */

export * from './access-project/types'
export { accessProject } from './access-project/service'
export { getAccessHistory } from './access-project/history'
export { validateAccessRequest } from './access-project/validation'
