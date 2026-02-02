/**
 * Project Notifications API - Validation
 *
 * Zod schemas for validating request parameters and bodies.
 */

import { z } from 'zod'

/**
 * POST request body validation schema
 * Validates manual notification resend requests
 */
export const resendNotificationSchema = z.object({
  reason: z.string().max(500).optional(),
})

/**
 * Query parameters validation schema
 */
export const notificationsQuerySchema = z.object({
  limit: z.number().min(1).max(500).default(50),
})
