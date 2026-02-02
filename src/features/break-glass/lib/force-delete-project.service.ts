/**
 * Force Delete Project Service
 * @deprecated Re-exports from force-delete-project module for backward compatibility
 * Import from './force-delete-project' instead
 *
 * Service layer for the force delete project break glass power.
 * Handles the business logic for immediately deleting projects with full audit logging.
 */

export * from './force-delete-project/types'
export { forceDeleteProject } from './force-delete-project/service'
export { getForceDeleteHistory } from './force-delete-project/history'
export { validateForceDeleteRequest } from './force-delete-project/validation'
