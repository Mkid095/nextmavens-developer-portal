/**
 * Access Project Service Module
 *
 * Service layer for the access project break glass power.
 * Allows platform operators to access ANY project details, bypassing normal
 * ownership checks for investigation purposes.
 *
 * US-008: Implement Access Any Project Power
 *
 * @example
 * ```typescript
 * import { accessProject } from '@/features/break-glass/lib/access-project';
 *
 * const result = await accessProject({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 * });
 *
 * console.log('Project owner:', result.project.developer_id);
 * ```
 */

export * from './types'
export { accessProject } from './service'
export { getAccessHistory } from './history'
export { validateAccessRequest } from './validation'
