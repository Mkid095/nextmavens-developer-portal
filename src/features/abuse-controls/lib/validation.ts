/**
 * Validation Schemas for Abuse Controls
 *
 * Provides Zod validation schemas for all abuse control operations.
 * Ensures type safety and input sanitization for API endpoints.
 */

import { z } from 'zod'
import { HardCapType } from '../types'

/**
 * Project ID validation schema
 * - Must be a non-empty string
 * - Must be alphanumeric with hyphens and underscores
 * - Max length: 100 characters
 * - Prevents SQL injection by restricting characters
 */
export const projectIdSchema = z
  .string({
    message: 'Project ID is required',
  })
  .min(1, 'Project ID cannot be empty')
  .max(100, 'Project ID is too long (max 100 characters)')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Project ID must contain only alphanumeric characters, hyphens, and underscores'
  )

/**
 * Hard Cap Type validation schema
 * - Must be a valid HardCapType enum value
 */
export const hardCapTypeSchema = z.enum([
  HardCapType.DB_QUERIES_PER_DAY,
  HardCapType.REALTIME_CONNECTIONS,
  HardCapType.STORAGE_UPLOADS_PER_DAY,
  HardCapType.FUNCTION_INVOCATIONS_PER_DAY,
], {
  message: 'Invalid cap type. Must be one of: db_queries_per_day, realtime_connections, storage_uploads_per_day, function_invocations_per_day',
})

/**
 * Suspension reason details validation schema
 * - details field is optional
 * - If provided, must be a string with max length
 * - Prevents excessively long strings that could cause issues
 */
export const suspensionDetailsSchema = z
  .string()
  .max(500, 'Suspension details cannot exceed 500 characters')
  .optional()

/**
 * Suspension notes validation schema
 * - notes field is optional
 * - If provided, must be a string with max length
 * - Used for manual suspensions by operators
 */
export const suspensionNotesSchema = z
  .string()
  .max(1000, 'Suspension notes cannot exceed 1000 characters')
  .optional()

/**
 * Numeric value validation for quota limits
 * - Must be a non-negative number
 * - Must be an integer (no decimals)
 * - Must be within reasonable bounds
 */
export const quotaValueSchema = z
  .number({
    message: 'Quota value is required',
  })
  .int('Quota value must be an integer')
  .nonnegative('Quota value cannot be negative')
  .max(1_000_000, 'Quota value is too large (max 1,000,000)')

/**
 * Manual suspension request validation schema
 * Validates the request body for manual suspension operations
 */
export const manualSuspensionSchema = z.object({
  cap_type: hardCapTypeSchema,
  current_value: quotaValueSchema,
  limit_exceeded: quotaValueSchema,
  details: suspensionDetailsSchema,
  notes: suspensionNotesSchema,
})

/**
 * Manual unsuspension request validation schema
 * Validates the request body for manual unsuspension operations
 */
export const manualUnsuspensionSchema = z.object({
  notes: suspensionNotesSchema,
})

/**
 * Quota update request validation schema
 * Validates the request body for quota update operations
 */
export const quotaUpdateSchema = z.object({
  cap_type: hardCapTypeSchema,
  cap_value: quotaValueSchema,
})

/**
 * Bulk quota update request validation schema
 * Validates the request body for updating multiple quotas at once
 */
export const bulkQuotaUpdateSchema = z.object({
  quotas: z.array(
    z.object({
      cap_type: hardCapTypeSchema,
      cap_value: quotaValueSchema,
    }),
    {
      message: 'Quotas array is required',
    }
  ).min(1, 'At least one quota must be provided').max(10, 'Cannot update more than 10 quotas at once'),
})

/**
 * IP address validation schema (for rate limiting by IP)
 * - Must be a valid IPv4 or IPv6 address
 * - Prevents injection attacks
 */
export const ipAddressSchema = z
  .string({
    message: 'IP address is required',
  })
  .refine(
    (value: string) => {
      // IPv4 regex pattern
      const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/
      // IPv6 regex pattern (simplified)
      const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/

      return ipv4Pattern.test(value) || ipv6Pattern.test(value)
    },
    { message: 'Invalid IP address format' }
  )

/**
 * Project query parameter validation schema
 * Validates query parameters for project-related API requests
 */
export const projectQuerySchema = z.object({
  projectId: projectIdSchema,
})

/**
 * Pagination query parameters validation schema
 * Validates pagination parameters for list endpoints
 */
export const paginationQuerySchema = z.object({
  page: z.coerce
    .number({
      message: 'Page must be a number',
    })
    .int('Page must be an integer')
    .positive('Page must be positive')
    .default(1),
  limit: z.coerce
    .number({
      message: 'Limit must be a number',
    })
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
})

/**
 * Sorting parameters validation schema
 * Validates sorting parameters for list endpoints
 */
export const sortingQuerySchema = z.object({
  sort_by: z
    .enum(['suspended_at', 'cap_exceeded', 'project_id'], {
      message: 'Invalid sort field',
    })
    .default('suspended_at'),
  sort_order: z
    .enum(['asc', 'desc'], {
      message: 'Sort order must be asc or desc',
    })
    .default('desc'),
})

/**
 * Email validation schema (for rate limiting by email/org)
 * - Must be a valid email format
 * - Prevents injection attacks
 */
export const emailSchema = z
  .string({
    message: 'Email is required',
  })
  .email('Invalid email format')
  .max(255, 'Email is too long')

/**
 * Type exports for inference
 */
export type ManualSuspensionInput = z.infer<typeof manualSuspensionSchema>
export type ManualUnsuspensionInput = z.infer<typeof manualUnsuspensionSchema>
export type QuotaUpdateInput = z.infer<typeof quotaUpdateSchema>
export type BulkQuotaUpdateInput = z.infer<typeof bulkQuotaUpdateSchema>
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type SortingQuery = z.infer<typeof sortingQuerySchema>
