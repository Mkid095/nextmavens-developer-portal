import { z } from 'zod'

// Environment enum
export const environmentEnum = z.enum(['prod', 'dev', 'staging'], {
  errorMap: () => ({ message: 'Environment must be one of: prod, dev, staging' }),
})

// Organization role enum
export const organizationRoleEnum = z.enum(['owner', 'admin', 'developer', 'viewer'], {
  errorMap: () => ({ message: 'Role must be one of: owner, admin, developer, viewer' }),
})

// API key type enum
export const apiKeyTypeEnum = z.enum(['public', 'secret', 'service_role', 'mcp'], {
  errorMap: () => ({ message: 'Key type must be one of: public, secret, service_role, mcp' }),
})

// MCP access level enum for granular permissions
export const mcpAccessLevelEnum = z.enum(['ro', 'rw', 'admin'], {
  errorMap: () => ({ message: 'MCP access level must be one of: ro, rw, admin' }),
})

// API key environment enum
export const apiKeyEnvironmentEnum = z.enum(['live', 'test', 'dev'], {
  errorMap: () => ({ message: 'Key environment must be one of: live, test, dev' }),
})

// API key scope enum (common scopes)
export const apiKeyScopeEnum = z.enum([
  'db:select',
  'db:insert',
  'db:update',
  'db:delete',
  'storage:read',
  'storage:write',
  'auth:signin',
  'auth:manage',
  'graphql:execute',
  'realtime:subscribe',
  'realtime:publish',
  'admin:all',
])

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

// Create API key schema
export const createApiKeySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name must be at most 255 characters'),
  project_id: z.string().uuid('Invalid project ID format').optional(),
  key_type: apiKeyTypeEnum.default('public'),
  environment: apiKeyEnvironmentEnum.default('live'),
  scopes: z.array(apiKeyScopeEnum).optional(),
})

// Query parameters for listing API keys
export const listApiKeysQuerySchema = z.object({
  project_id: z.string().uuid('Invalid project ID format').optional(),
  key_type: apiKeyTypeEnum.optional(),
  environment: apiKeyEnvironmentEnum.optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
  offset: z.string().transform(Number).refine(n => n >= 0, 'Offset must be non-negative').optional(),
})

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
export type ListApiKeysQuery = z.infer<typeof listApiKeysQuerySchema>
export type ApiKeyType = z.infer<typeof apiKeyTypeEnum>
export type ApiKeyEnvironment = z.infer<typeof apiKeyEnvironmentEnum>
export type ApiKeyScope = z.infer<typeof apiKeyScopeEnum>

// Service enum for usage and quotas
export const serviceEnum = z.enum(['database', 'realtime', 'storage', 'auth', 'functions'], {
  errorMap: () => ({ message: 'Service must be one of: database, realtime, storage, auth, functions' }),
})

// Metric type enum for usage tracking
export const metricTypeEnum = z.enum([
  'db_query',
  'db_row_read',
  'db_row_written',
  'realtime_message',
  'storage_upload',
  'storage_download',
  'auth_request',
  'function_invocation',
], {
  errorMap: () => ({ message: 'Invalid metric type' }),
})

// Time period enum for usage queries
export const timePeriodEnum = z.enum(['hour', 'day', 'week', 'month'], {
  errorMap: () => ({ message: 'Time period must be one of: hour, day, week, month' }),
})

// Usage check schema
export const usageCheckSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  service: serviceEnum,
  metric: metricTypeEnum,
  operation: z.enum(['increment', 'check']),
  amount: z.number().int().positive().default(1),
})

// Query parameters for listing usage
export const listUsageQuerySchema = z.object({
  project_id: z.string().uuid('Invalid project ID format').optional(),
  service: serviceEnum.optional(),
  metric: metricTypeEnum.optional(),
  period: timePeriodEnum.default('day'),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
  offset: z.string().transform(Number).refine(n => n >= 0, 'Offset must be non-negative').optional(),
})

// Quota update schema
export const updateQuotasSchema = z.object({
  db_queries_per_day: z.number().int().positive().optional(),
  realtime_connections: z.number().int().positive().optional(),
  storage_uploads_per_day: z.number().int().positive().optional(),
  function_invocations_per_day: z.number().int().positive().optional(),
})

// Query parameters for listing quotas
export const listQuotasQuerySchema = z.object({
  project_id: z.string().uuid('Invalid project ID format').optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
  offset: z.string().transform(Number).refine(n => n >= 0, 'Offset must be non-negative').optional(),
})

export type Service = z.infer<typeof serviceEnum>
export type MetricType = z.infer<typeof metricTypeEnum>
export type TimePeriod = z.infer<typeof timePeriodEnum>
export type UsageCheckInput = z.infer<typeof usageCheckSchema>
export type ListUsageQuery = z.infer<typeof listUsageQuerySchema>
export type UpdateQuotasInput = z.infer<typeof updateQuotasSchema>
export type ListQuotasQuery = z.infer<typeof listQuotasQuerySchema>
