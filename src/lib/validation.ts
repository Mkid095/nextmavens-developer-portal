/**
 * Validation Schemas
 *
 * Provides Zod validation schemas for API endpoints.
 * Ensures type safety and input sanitization.
 */

import { z } from 'zod'

// Organization role enum
export const organizationRoleEnum = z.enum(['owner', 'admin', 'developer', 'viewer'], {
  errorMap: () => ({ message: 'Role must be one of: owner, admin, developer, viewer' }),
})

// Update member role schema
export const updateMemberRoleSchema = z.object({
  role: organizationRoleEnum,
})

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
