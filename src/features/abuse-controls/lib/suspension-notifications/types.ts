/**
 * Suspension Notifications Module - Type Definitions
 */

import type { SuspensionNotification, SuspensionNotificationParams, SuspensionNotificationStatus } from '../../types'

export type { SuspensionNotification, SuspensionNotificationParams, SuspensionNotificationStatus }

/**
 * Email send result wrapper
 */
export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}
