/**
 * API Route: Project Manual Overrides
 *
 * @deprecated This file has been refactored into the overrides-api module.
 * Please import from './overrides-api' instead.
 *
 * POST /api/projects/[projectId]/overrides
 * - Perform a manual override on a project
 * - Allows operators/admins to unsuspend projects, increase caps, etc.
 *
 * GET /api/projects/[projectId]/overrides
 * - Get override history for a project
 * - Accessible by project owner or operators/admins
 */

export { POST } from './overrides-api/post-handler'
export { GET } from './overrides-api/get-handler'
