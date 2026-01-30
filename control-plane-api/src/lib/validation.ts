import { z } from 'zod'

// Environment enum
export const environmentEnum = z.enum(['prod', 'dev', 'staging'], {
  errorMap: () => ({ message: 'Environment must be one of: prod, dev, staging' }),
})

// Organization role enum
export const organizationRoleEnum = z.enum(['owner', 'admin', 'developer', 'viewer'], {
  errorMap: () => ({ message: 'Role must be one of: owner, admin, developer, viewer' }),
})

// Project creation schema
export const createProjectSchema = z.object({
  project_name: z.string().min(2, 'Project name must be at least 2 characters').max(100, 'Project name must be at most 100 characters'),
  environment: environmentEnum.default('prod'),
  webhook_url: z.string().url('Webhook URL must be a valid URL').optional().nullable(),
  allowed_origins: z.array(z.string().url('Each allowed origin must be a valid URL')).optional().nullable(),
})

// Project update schema
export const updateProjectSchema = z.object({
  project_name: z.string().min(2).max(100).optional(),
  environment: environmentEnum.optional(),
  webhook_url: z.string().url().optional().nullable(),
  allowed_origins: z.array(z.string().url()).optional().nullable(),
  rate_limit: z.number().int().positive().optional(),
})

// Query parameters for listing projects
export const listProjectsQuerySchema = z.object({
  status: z.enum(['active', 'suspended', 'archived']).optional(),
  environment: environmentEnum.optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
  offset: z.string().transform(Number).refine(n => n >= 0, 'Offset must be non-negative').optional(),
})

// Organization creation schema
export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(255, 'Organization name must be at most 255 characters'),
})

// Organization update schema
export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(255).optional(),
})

// Add member to organization schema
export const addMemberSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  role: organizationRoleEnum.default('developer'),
})

// Update member role schema
export const updateMemberRoleSchema = z.object({
  role: organizationRoleEnum,
})

// Query parameters for listing organizations
export const listOrganizationsQuerySchema = z.object({
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
  offset: z.string().transform(Number).refine(n => n >= 0, 'Offset must be non-negative').optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type AddMemberInput = z.infer<typeof addMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
export type ListOrganizationsQuery = z.infer<typeof listOrganizationsQuerySchema>
