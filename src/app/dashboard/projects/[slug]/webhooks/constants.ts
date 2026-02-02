/**
 * Webhooks Page Constants
 * Event types, configuration, and constants for the webhooks page
 */

import type { EventType } from '@/lib/types/webhook.types'

export const EVENT_TYPES: EventType[] = [
  'project.created',
  'project.suspended',
  'project.deleted',
  'user.signedup',
  'user.deleted',
  'file.uploaded',
  'file.deleted',
  'key.created',
  'key.rotated',
  'key.revoked',
  'function.executed',
  'usage.threshold',
]

export const MAX_RETRY_ATTEMPTS = 5

export const STATUS_COLORS = {
  delivered: 'bg-green-900/30 text-green-400',
  failed: 'bg-red-900/30 text-red-400',
  pending: 'bg-yellow-900/30 text-yellow-400',
} as const

export const STATUS_ICONS = {
  delivered: 'CheckCircle',
  failed: 'XCircle',
  pending: 'Clock',
} as const

export const WEBHOOK_INFO_ITEMS = [
  {
    icon: 'CheckCircle',
    color: 'text-blue-500',
    text: 'Webhooks are sent as POST requests to your target URL with a JSON payload',
  },
  {
    icon: 'CheckCircle',
    color: 'text-blue-500',
    text: 'Each webhook includes a signature header (X-Webhook-Signature) for verification',
  },
  {
    icon: 'CheckCircle',
    color: 'text-blue-500',
    text: 'Webhooks are retried up to 5 times with exponential backoff on failure',
  },
  {
    icon: 'CheckCircle',
    color: 'text-blue-500',
    text: 'After 5 consecutive failures, a webhook is automatically disabled',
  },
] as const
