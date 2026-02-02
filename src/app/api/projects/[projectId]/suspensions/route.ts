/**
 * Suspensions API Route Handlers
 *
 * GET /api/projects/[projectId]/suspensions - Get suspension status
 * POST /api/projects/[projectId]/suspensions - Manually suspend a project
 * DELETE /api/projects/[projectId]/suspensions - Unsuspend a project
 */

export { GET } from './get'
export { POST } from './post'
export { DELETE } from './delete'

export type {
  SuspensionStatusResponse,
  ManualSuspensionRequest,
  ManualUnsuspensionRequest,
  SuspensionsErrorResponse,
} from './types'
