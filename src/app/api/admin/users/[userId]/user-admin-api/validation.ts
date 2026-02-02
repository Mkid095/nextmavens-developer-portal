/**
 * Admin Users API - Validation
 *
 * Zod schemas for validating request parameters and bodies.
 */

import { z } from 'zod'

/**
 * Schema for validating user metadata updates
 */
export const userMetadataSchema = z.object({
  user_metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Schema for validating user ID parameter
 */
export const userIdSchema = z.string().min(1, 'User ID is required')
