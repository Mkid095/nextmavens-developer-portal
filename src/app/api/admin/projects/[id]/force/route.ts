/**
 * Force Delete Project API Route
 * @deprecated Re-exports from force module for backward compatibility
 *
 * POST /api/admin/projects/[id]/force
 * GET /api/admin/projects/[id]/force
 * DELETE /api/admin/projects/[id]/force
 *
 * US-006: Implement Force Delete Power
 */

export * from './types'
export { POST, GET, DELETE } from './handlers'
