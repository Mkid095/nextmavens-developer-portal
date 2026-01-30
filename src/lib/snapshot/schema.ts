/**
 * Snapshot Schema Validation
 *
 * Zod schemas for runtime validation of control plane snapshot responses.
 * Ensures data plane services receive well-formed, validated data.
 *
 * US-009: Schema validation on response
 */

import { z } from 'zod'

/**
 * Project status enum
 * Must match database schema (lowercase)
 */
export const ProjectStatusSchema = z.enum([
  'created',
  'active',
  'suspended',
  'archived',
  'deleted',
])

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>

/**
 * Environment type
 */
export const EnvironmentSchema = z.enum([
  'development',
  'staging',
  'production',
])

export type Environment = z.infer<typeof EnvironmentSchema>

/**
 * Service configuration
 * Each service has an enabled flag and optional config object
 */
export const ServiceConfigSchema = z.object({
  enabled: z.boolean(),
  config: z.record(z.unknown()).optional(),
})

export type ServiceConfig = z.infer<typeof ServiceConfigSchema>

/**
 * Services object - all available services and their states
 */
export const ServicesSchema = z.object({
  auth: ServiceConfigSchema,
  graphql: ServiceConfigSchema,
  realtime: ServiceConfigSchema,
  storage: ServiceConfigSchema,
  database: ServiceConfigSchema,
  functions: ServiceConfigSchema,
})

export type Services = z.infer<typeof ServicesSchema>

/**
 * Rate limit configuration
 * Defines per-minute, per-hour, and per-day request limits
 */
export const RateLimitSchema = z.object({
  requests_per_minute: z.number().int().nonnegative(),
  requests_per_hour: z.number().int().nonnegative(),
  requests_per_day: z.number().int().nonnegative(),
})

export type RateLimit = z.infer<typeof RateLimitSchema>

/**
 * Hard quota limits
 * Defines resource quotas that cannot be exceeded
 */
export const QuotasSchema = z.object({
  db_queries_per_day: z.number().int().nonnegative(),
  realtime_connections: z.number().int().nonnegative(),
  storage_uploads_per_day: z.number().int().nonnegative(),
  function_invocations_per_day: z.number().int().nonnegative(),
})

export type Quotas = z.infer<typeof QuotasSchema>

/**
 * Project information in snapshot
 */
export const SnapshotProjectSchema = z.object({
  id: z.string().uuid(),
  status: ProjectStatusSchema,
  environment: EnvironmentSchema,
  tenant_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type SnapshotProject = z.infer<typeof SnapshotProjectSchema>

/**
 * Snapshot metadata
 */
export const SnapshotMetadataSchema = z.object({
  generatedAt: z.string().datetime(),
  ttl: z.number().int().positive(),
  cacheHit: z.boolean(),
})

export type SnapshotMetadata = z.infer<typeof SnapshotMetadataSchema>

/**
 * Version string format
 * Must be in the format "v1", "v2", etc.
 */
export const VersionStringSchema = z.string().regex(/^v\d+$/, {
  message: 'Version must be in format "v1", "v2", etc.',
})

export type VersionString = z.infer<typeof VersionStringSchema>

/**
 * Control Plane Snapshot - main schema
 *
 * This is the authoritative schema for snapshot responses.
 * All snapshot responses MUST validate against this schema.
 */
export const ControlPlaneSnapshotSchema = z.object({
  version: VersionStringSchema,
  project: SnapshotProjectSchema,
  services: ServicesSchema,
  limits: RateLimitSchema,
  quotas: QuotasSchema,
})

export type ControlPlaneSnapshot = z.infer<typeof ControlPlaneSnapshotSchema>

/**
 * Snapshot response wrapper
 * This is the format returned by the /api/internal/snapshot endpoint
 */
export const SnapshotResponseSchema = z.object({
  snapshot: ControlPlaneSnapshotSchema,
  metadata: SnapshotMetadataSchema,
})

export type SnapshotResponse = z.infer<typeof SnapshotResponseSchema>

/**
 * Validate a snapshot object against the schema
 * @throws {z.ZodError} if validation fails
 */
export function validateSnapshot(data: unknown): ControlPlaneSnapshot {
  return ControlPlaneSnapshotSchema.parse(data)
}

/**
 * Safe validation - returns result instead of throwing
 */
export function validateSnapshotSafe(
  data: unknown
): z.SafeParseReturnType<unknown, ControlPlaneSnapshot> {
  return ControlPlaneSnapshotSchema.safeParse(data)
}

/**
 * Validate a full snapshot response (including metadata)
 */
export function validateSnapshotResponse(data: unknown): SnapshotResponse {
  return SnapshotResponseSchema.parse(data)
}

/**
 * Get validation error details in a standardized format
 */
export function getValidationErrorDetails(error: z.ZodError): {
  field: string
  message: string
  expected: string
  received: unknown
}[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    expected: `Expected ${err.expected}`,
    received: err.received,
  }))
}
