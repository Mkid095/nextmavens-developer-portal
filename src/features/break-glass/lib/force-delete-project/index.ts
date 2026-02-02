/**
 * Force Delete Project Service Module
 *
 * Service layer for the force delete project break glass power.
 * Handles the business logic for immediately deleting projects with full audit logging.
 *
 * US-006: Implement Force Delete Power - Step 1: Foundation
 *
 * @example
 * ```typescript
 * import { forceDeleteProject } from '@/features/break-glass/lib/force-delete-project';
 *
 * const result = await forceDeleteProject({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 *   reason: 'Security incident - immediate removal required',
 * });
 *
 * console.log('Deleted:', result.deleted_project.status);
 * ```
 */

export * from './types'
export { forceDeleteProject } from './service'
export { getForceDeleteHistory } from './history'
export { validateForceDeleteRequest } from './validation'
