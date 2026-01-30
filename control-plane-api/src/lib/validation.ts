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

// MCP access level enum
export const mcpAccessLevelEnum = z.enum(['ro', 'rw', 'admin'], {
  errorMap: () => ({ message: 'MCP access level must be one of: ro (read-only), rw (read-write), admin' }),
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
  status: z.enum(['active', 'suspended', 'archived', 'deleted']).optional(),
  environment: environmentEnum.optional(),
  organization_id: z.string().uuid('Invalid organization ID format').optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
  offset: z.string().transform(Number).refine(n => n >= 0, 'Offset must be non-negative').optional(),
})

// Organization creation schema
export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(255, 'Organization name must be at most 255 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
})

// Organization update schema
export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(255).optional(),
})

// Add member to organization schema (by existing user ID)
export const addMemberSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  role: organizationRoleEnum.default('developer'),
})

// Invite member to organization schema (by email)
export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: organizationRoleEnum.default('developer'),
})

// Organization member status enum
export const memberStatusEnum = z.enum(['pending', 'accepted', 'declined'], {
  errorMap: () => ({ message: 'Status must be one of: pending, accepted, declined' }),
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
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
export type ListOrganizationsQuery = z.infer<typeof listOrganizationsQuerySchema>
export type MemberStatus = z.infer<typeof memberStatusEnum>

// Create API key schema
export const createApiKeySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name must be at most 255 characters'),
  project_id: z.string().uuid('Invalid project ID format').optional(),
  key_type: apiKeyTypeEnum.default('public'),
  environment: apiKeyEnvironmentEnum.default('live'),
  scopes: z.array(apiKeyScopeEnum).optional(),
  // MCP access level - required when key_type is 'mcp'
  mcp_access_level: mcpAccessLevelEnum.optional(),
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
export type McpAccessLevel = z.infer<typeof mcpAccessLevelEnum>

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
  'realtime_connection',
  'storage_upload',
  'storage_download',
  'storage_bytes',
  'auth_signup',
  'auth_signin',
  'function_invocation',
])

// Time period enum for usage queries
export const timePeriodEnum = z.enum(['hour', 'day', 'week', 'month'], {
  errorMap: () => ({ message: 'Time period must be one of: hour, day生活费, week, month' }),
})

// Get current usage metrics query schema
export const getUsageQuerySchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  service: serviceEnum.optional(),
  metric_type: metricTypeEnum.optional(),
  period: timePeriodEnum.default('day'),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 1000, 'Limit must be between 1 and 1000').default('100'),
  offset: z.string().transform(Number).refine(n => n >= 0, 'Offset must be non-negative').default('0'),
})

// Check quota schema
export const checkQuotaSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  service: serviceEnum,
  quantity: z.number().int().positive('Quantity must be a positive integer'),
})

// Update quota schema
export const updateQuotaSchema = z.object({
  service: serviceEnum,
  monthly_limit: z.number().int().min(0, 'Monthly limit must be non-negative').optional(),
  hard_cap: z.number().int().min(0, 'Hard cap must be non-negative').optional(),
})

export type Service = z.infer<typeof serviceEnum>
export type MetricType = z.infer<typeof metricTypeEnum>
export type TimePeriod = z.infer<typeof timePeriodEnum>
export type GetUsageQuery = z.infer<typeof getUsageQuerySchema>
export type CheckQuotaInput = z.infer<typeof checkQuotaSchema>
export type UpdateQuotaInput = z.infer<typeof updateQuotaSchema>

// Job type enum for background jobs
export const jobTypeEnum = z.enum([
  'provision_project',
  'rotate_key',
  'deliver_webhook',
  'export_backup',
  'check_usage_limits',
  'auto_suspend',
], {
  errorMap: () => ({ message: 'Job type must be one of: provision_project, rotate_key, deliver_webhook, export_backup, check_usage_limits, auto_suspend' }),
})

// Job status enum
export const jobStatusEnum = z.enum(['pending', 'running', 'failed', 'completed'], {
  errorMap: () => ({ message: 'Job status must be one of: pending, running, failed, completed' }),
})

// Query parameters for listing jobs
export const listJobsQuerySchema = z.object({
  project_id: z.string().uuid('Invalid project ID format').optional(),
  type: jobTypeEnum.optional(),
  status: jobStatusEnum.optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').default('50'),
  offset: z.string().transform(Number).refine(n => n >= 0, 'Offset must be non-negative').default('0'),
})

export type JobType = z.infer<typeof jobTypeEnum>
export type JobStatus = z.infer<typeof jobStatusEnum>
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>

// Audit log type enum
export const auditLogTypeEnum = z.enum([
  'suspension',
  'unsuspension',
  'auth_failure',
  'rate_limit_exceeded',
  'validation_failure',
  'background_job',
  'manual_intervention',
], {
  errorMap: () => ({ message: 'Audit log type must be one of: suspension, unsuspension, auth_failure, rate_limit_exceeded, validation_failure, background_job, manual_intervention' }),
})

// Audit log severity enum
export const auditLogSeverityEnum = z.enum(['info', 'warning', 'error', 'critical'], {
  errorMap: () => ({ message: 'Severity must be one of: info, warning, error, critical' }),
})

// Query parameters for listing audit logs
export const listAuditLogsQuerySchema = z.object({
  actor_id: z.string().uuid('Invalid actor ID format').optional(),
  action: z.string().min(1).optional(),
  log_type: auditLogTypeEnum.optional(),
  severity: auditLogSeverityEnum.optional(),
  project_id: z.string().uuid('Invalid project ID format').optional(),
  start_date: z.string().datetime('Invalid start date format').optional(),
  end_date: z.string().datetime('Invalid end date format').optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 1000, 'Limit must be between 1 and 1000').default('100'),
  offset: z.string().transform(Number).refine(n => n >= 0, 'Offset must be non-negative').default('0'),
})

export type AuditLogType = z.infer<typeof auditLogTypeEnum>
export type AuditLogSeverity = z.infer<typeof auditLogSeverityEnum>
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>

// Actor type enum for audit logs (control_plane schema)
export const actorTypeEnum = z.enum(['user', 'system', 'api_key', 'project'], {
  errorMap: () => ({ message: 'Actor type must be one of: user, system, api_key, project' }),
})

// Target type enum for audit logs
export const targetTypeEnum = z.enum([
  'project',
  'api_key',
  'user',
  'secret',
  'organization',
  'team',
  'webhook',
], {
  errorMap: () => ({ message: 'Target type must be one of: project, api_key, user, secret, organization, team, webhook' }),
})

// Audit action enum (common actions)
export const auditActionEnum = z.enum([
  'project.created',
  'project.updated',
  'project.deleted',
  'project.suspended',
  'project.auto_suspended',
  'project.activated',
  'key.created',
  'key.rotated',
  'key.revoked',
  'key.deleted',
  'user.invited',
  'user.removed',
  'user.role_changed',
  'user.enabled',
  'user.disabled',
  'secret.created',
  'secret.accessed',
  'secret.rotated',
  'secret.deleted',
  'webhook.created',
  'webhook.updated',
  'webhook.deleted',
  'webhook.delivered',
  'webhook.failed',
  'organization.created',
  'organization.updated',
  'organization.deleted',
  'quota.updated',
  'suspension.created',
  'suspension.removed',
], {
  errorMap: () => ({ message: 'Invalid audit action' }),
})

// Query parameters for listing audit logs (control_plane schema)
export const listAuditQuerySchema = z.object({
  actor_id: z.string().uuid('Invalid actor ID format').optional(),
  actor_type: actorTypeEnum.optional(),
  action: auditActionEnum.optional(),
  target_type: targetTypeEnum.optional(),
  target_id: z.string().uuid('Invalid target ID format').optional(),
  project_id: z.string().uuid('Invalid project ID format').optional(),
  request_id: z.string().uuid('Invalid request ID format').optional(),
  start_date: z.string().datetime('Invalid start date format').optional(),
  end_date: z.string().datetime('Invalid end date format').optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 1000, 'Limit must be between 1 and 1000').default('100'),
  offset: z.string().transform(Number).refine(n => n >= 0, 'Offset must be non-negative').default('0'),
})

export type ActorType = z.infer<typeof actorTypeEnum>
export type TargetType = z.infer<typeof targetTypeEnum>
export type AuditAction = z.infer<typeof auditActionEnum>
export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>

// Webhook event type enum
export const webhookEventEnum = z.enum([
  'project.created',
  'project.updated',
  'project.deleted',
  'project.suspended',
  'project.activated',
  'user.signedup',
  'file.uploaded',
  'key.created',
  'key.rotated',
  'key.revoked',
  'quota.exceeded',
  'webhook.delivered',
  'webhook.failed',
], {
  errorMap: () => ({ message: 'Invalid webhook event type' }),
})

// Create webhook schema
export const createWebhookSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  event: webhookEventEnum,
  target_url: z.string().url('Target URL must be a valid URL').max(2048, 'Target URL must be at most 2048 characters'),
  secret: z.string().min(16, 'Secret must be at least 16 characters').max(255, 'Secret must be at most 255 characters').optional(),
  enabled: z.boolean().optional().default(true),
})

// Update webhook schema
export const updateWebhookSchema = z.object({
  event: webhookEventEnum.optional(),
  target_url: z.string().url('Target URL must be a valid URL').max(2048, 'Target URL must be at most 2048 characters').optional(),
  secret: z.string().min(16, 'Secret must be at least 16 characters').max(255, 'Secret must be at most 255 characters').optional(),
  enabled: z.boolean().optional(),
})

// Query parameters for listing webhooks
export const listWebhooksQuerySchema = z.object({
  project_id: z.string().uuid('Invalid project ID format').optional(),
  event: webhookEventEnum.optional(),
  enabled: z.coerce.boolean().optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').default('50'),
  offset: z.string().transform(Number).refine(n => n >= 0, 'Offset must be non-negative').default('0'),
})

export type WebhookEvent = z.infer<typeof webhookEventEnum>
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>
export type ListWebhooksQuery = z.infer<typeof listWebhooksQuerySchema>
