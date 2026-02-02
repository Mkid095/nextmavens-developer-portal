/**
 * Project Notifications API - Type Definitions
 *
 * API Route: Project Notification History
 *
 * GET /api/projects/[projectId]/notifications
 * POST /api/projects/[projectId]/notifications
 */

import type { SuspensionReason } from '@/features/abuse-controls/types'
import type { Developer } from '@/lib/auth'

/**
 * POST request body for manual notification resend
 */
export interface ResendNotificationRequest {
  reason?: string
}

/**
 * Response data for GET /notifications
 */
export interface NotificationsResponseData {
  projectId: string
  notifications: Array<{
    id: string
    project_id: string
    recipient_email: string
    channel: string
    sent_at: string
    status: string
    error?: string
  }>
  count: number
}

/**
 * Response data for POST /notifications
 */
export interface NotificationResendResponseData {
  projectId: string
  notificationSent: boolean
  recipients: {
    total: number
    successful: number
    failed: number
  }
  details: Array<{
    success: boolean
    notificationId: string
    channel: string
    error?: string
  }>
}

/**
 * Handler context shared between GET and POST
 */
export interface HandlerContext {
  request: Request
  params: { projectId: string }
  startTime: number
  clientIP: string
}

/**
 * Project details for notification
 */
export interface ProjectDetails {
  projectName: string
  orgName: string
}
