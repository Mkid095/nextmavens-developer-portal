/**
 * API Route: Project Notification History
 *
 * @deprecated This file has been refactored into the notifications-api module.
 * Please import from './notifications-api' instead.
 *
 * GET /api/projects/[projectId]/notifications
 * - Retrieve notification history for a project
 * - Requires: Project owner or operator/admin role
 *
 * POST /api/projects/[projectId]/notifications
 * - Manually trigger notification resend
 * - Requires: Operator or admin role (security measure to prevent spam)
 */

export { GET } from './notifications-api/get-handler'
export { POST } from './notifications-api/post-handler'
