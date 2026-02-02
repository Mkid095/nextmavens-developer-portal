/**
 * Notification Types
 * Types for system notifications and alerts
 */

import { SuspensionReason } from './suspension.types'

/**
 * Notification types for system events
 */
export enum NotificationType {
  /** Project suspended notification */
  PROJECT_SUSPENDED = 'project_suspended',
  /** Project unsuspended notification */
  PROJECT_UNSUSPENDED = 'project_unsuspended',
  /** Quota warning notification */
  QUOTA_WARNING = 'quota_warning',
  /** Usage spike detected notification */
  USAGE_SPIKE_DETECTED = 'usage_spike_detected',
  /** Error rate detected notification */
  ERROR_RATE_DETECTED = 'error_rate_detected',
  /** Malicious pattern detected notification */
  MALICIOUS_PATTERN_DETECTED = 'malicious_pattern_detected',
  /** Webhook disabled notification */
  WEBHOOK_DISABLED = 'webhook_disabled',
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  /** Low priority - informational */
  LOW = 'low',
  /** Medium priority - requires attention */
  MEDIUM = 'medium',
  /** High priority - immediate action required */
  HIGH = 'high',
  /** Critical priority - service impacting */
  CRITICAL = 'critical',
}

/**
 * Notification delivery status
 */
export enum NotificationStatus {
  /** Notification is pending delivery */
  PENDING = 'pending',
  /** Notification was successfully delivered */
  DELIVERED = 'delivered',
  /** Notification delivery failed */
  FAILED = 'failed',
  /** Notification is being retried */
  RETRYING = 'retrying',
}

/**
 * Notification delivery channels
 */
export enum NotificationChannel {
  /** Email notification */
  EMAIL = 'email',
  /** In-app notification */
  IN_APP = 'in_app',
  /** SMS notification */
  SMS = 'sms',
  /** Webhook notification */
  WEBHOOK = 'webhook',
}

/**
 * Notification recipient information
 */
export interface NotificationRecipient {
  /** Recipient ID (user or org member ID) */
  id: string
  /** Recipient email address */
  email: string
  /** Recipient name */
  name?: string
  /** Recipient role in the organization */
  role?: string
}

/**
 * Notification record for database storage
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string
  /** Project ID associated with the notification */
  project_id: string
  /** Type of notification */
  notification_type: NotificationType
  /** Priority level of the notification */
  priority: NotificationPriority
  /** Notification subject/title */
  subject: string
  /** Notification body content */
  body: string
  /** Additional data associated with the notification */
  data: Record<string, unknown>
  /** Delivery channels to use */
  channels: NotificationChannel[]
  /** Current delivery status */
  status: NotificationStatus
  /** Number of delivery attempts made */
  attempts: number
  /** Timestamp when the notification was created */
  created_at: Date
  /** Timestamp when the notification was delivered */
  delivered_at?: Date
  /** Error message if delivery failed */
  error_message?: string
}

/**
 * Notification template for suspension notifications
 */
export interface SuspensionNotificationTemplate {
  /** Project name */
  project_name: string
  /** Organization name */
  org_name: string
  /** Suspension reason */
  reason: SuspensionReason
  /** When the suspension occurred */
  suspended_at: Date
  /** Support contact information */
  support_contact: string
  /** Resolution steps */
  resolution_steps: string[]
}

/**
 * Notification delivery result
 */
export interface NotificationDeliveryResult {
  /** Whether the delivery was successful */
  success: boolean
  /** Notification ID */
  notification_id: string
  /** Delivery channel used */
  channel: NotificationChannel
  /** Timestamp of delivery attempt */
  delivered_at: Date
  /** Error message if delivery failed */
  error?: string
  /** Number of attempts made */
  attempts: number
}

/**
 * Suspension notification type
 * Distinguishes between actual suspensions and warning notifications
 */
export enum SuspensionNotificationType {
  /** Project has been suspended */
  SUSPENSION = 'suspension',
  /** Warning about approaching limits */
  WARNING = 'warning',
}

/**
 * Suspension notification delivery status
 */
export enum SuspensionNotificationStatus {
  /** Notification is pending delivery */
  PENDING = 'pending',
  /** Notification has been sent */
  SENT = 'sent',
  /** Notification delivery failed */
  FAILED = 'failed',
}

/**
 * Suspension notification record
 * Tracks suspension notifications sent to project owners
 */
export interface SuspensionNotification {
  /** Unique identifier for the notification */
  id: string
  /** Project ID that was suspended */
  project_id: string
  /** Recipient email addresses */
  recipient_emails: string[]
  /** Reason for suspension */
  reason: string
  /** Which hard cap was exceeded */
  cap_exceeded: string
  /** Current usage value */
  current_usage: number
  /** The limit that was exceeded */
  limit: number
  /** Support contact information */
  support_contact: string
  /** Current delivery status */
  status: SuspensionNotificationStatus
  /** When the notification was sent */
  sent_at: Date | null
  /** Error message if delivery failed */
  error: string | null
  /** When the notification was created */
  created_at: Date
}

/**
 * Parameters for sending a suspension notification
 */
export interface SuspensionNotificationParams {
  /** Project ID that was suspended */
  projectId: string
  /** Recipient email addresses */
  recipientEmails: string[]
  /** Reason for suspension */
  reason: string
  /** Which hard cap was exceeded */
  capExceeded: string
  /** Current usage value */
  currentUsage: number
  /** The limit that was exceeded */
  limit: number
  /** Support contact information */
  supportContact: string
}
