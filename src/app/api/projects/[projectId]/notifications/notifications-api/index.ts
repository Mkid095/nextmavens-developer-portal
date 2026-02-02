/**
 * Project Notifications API Module
 *
 * API Route: Project Notification History
 *
 * GET /api/projects/[projectId]/notifications
 * - Retrieve notification history for a project
 * - Requires: Project owner or operator/admin role
 *
 * POST /api/projects/[projectId]/notifications
 * - Manually trigger notification resend
 * - Requires: Operator or admin role (security measure to prevent spam)
 */

// Type definitions
export * from './types'

// Validation schemas
export * from './validation'

// HTTP handlers
export * from './get-handler'
export * from './post-handler'
