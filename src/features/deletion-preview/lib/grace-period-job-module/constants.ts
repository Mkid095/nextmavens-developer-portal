/**
 * Grace Period Job - Module - Constants
 */

export const WARNING_DAYS_BEFORE = 7

export const LOG_SEPARATOR = '='.repeat(60)

export const JOB_QUERIES = {
  FIND_PROJECTS: `
    SELECT id, name, slug, tenant_id, deletion_scheduled_at, grace_period_ends_at
    FROM control_plane.projects
    WHERE status = 'DELETED'
      AND deletion_scheduled_at IS NOT NULL
      AND grace_period_ends_at IS NOT NULL
      AND deleted_at IS NULL
    ORDER BY grace_period_ends_at ASC
  `,
} as const

export const DELETE_QUERIES = {
  DROP_SCHEMA: (schema: string) => `DROP SCHEMA IF EXISTS ${schema} CASCADE`,
  DELETE_API_KEYS: 'DELETE FROM control_plane.api_keys WHERE project_id = $1',
  DELETE_WEBHOOKS: 'DELETE FROM control_plane.webhooks WHERE project_id = $1',
  DELETE_EDGE_FUNCTIONS: 'DELETE FROM control_plane.edge_functions WHERE project_id = $1',
  DELETE_STORAGE_BUCKETS: 'DELETE FROM control_plane.storage_buckets WHERE project_id = $1',
  DELETE_SECRETS: 'DELETE FROM control_plane.secrets WHERE project_id = $1',
  SET_DELETED_AT: `
    UPDATE control_plane.projects
    SET deleted_at = NOW()
    WHERE id = $1
  `,
} as const

export const LOG_MESSAGES = {
  JOB_START: (date: Date) => `[Grace Period Job] Started at ${date.toISOString()}`,
  JOB_COMPLETE: '[Grace Period Job] Completed',
  JOB_DURATION: (ms: number) => `[Grace Period Job] Duration: ${ms}ms`,
  JOB_FAILED: '[Grace Period Job] Failed',
  NO_PROJECTS: '[Grace Period Job] Completed - No projects in grace period',
  PROJECTS_FOUND: (count: number) => `[Grace Period Job] Found ${count} projects in grace period`,
  PROJECTS_NEAR_EXPIRATION: (count: number) => `[Grace Period Job] Projects near expiration: ${count}`,
  PROJECTS_TO_DELETE: (count: number) => `[Grace Period Job] Projects to hard delete: ${count}`,
  PROJECTS_CHECKED: (count: number) => `[Grace Period Job] Projects checked: ${count}`,
  PROJECTS_NEEDING_NOTIFICATION: (count: number) => `[Grace Period Job] Projects needing notification: ${count}`,
  PROJECTS_HARD_DELETED: (count: number) => `[Grace Period Job] Projects hard deleted: ${count}`,
  HARD_DELETED_PROJECT: (id: string, name: string) => `[Grace Period Job] Hard deleted project ${id} (${name})`,
  HARD_DELETE_FAILED: (id: string) => `[Grace Period Job] Failed to hard delete project ${id}`,
  SCHEMA_DROPPED: (schema: string) => `[Hard Delete] Dropped schema ${schema}`,
  SCHEMA_DROP_FAILED: (schema: string) => `[Hard Delete] Could not drop schema ${schema}`,
  DELETED_API_KEYS: (id: string) => `[Hard Delete] Deleted API keys for project ${id}`,
  DELETED_WEBHOOKS: (id: string) => `[Hard Delete] Deleted webhooks for project ${id}`,
  DELETED_EDGE_FUNCTIONS: (id: string) => `[Hard Delete] Deleted edge functions for project ${id}`,
  DELETED_STORAGE_BUCKETS: (id: string) => `[Hard Delete] Deleted storage buckets for project ${id}`,
  DELETED_SECRETS: (id: string) => `[Hard Delete] Deleted secrets for project ${id}`,
  SET_DELETED_AT: (id: string) => `[Hard Delete] Set deleted_at for project ${id}`,
  PROJECT_WARNING_HEADER: '[Grace Period Job] Projects needing 7-day warning:',
  PROJECT_DELETED_HEADER: '[Grace Period Job] Hard deleted projects:',
  PROJECT_WARNING_ITEM: (index: number, name: string, slug: string, days: number) =>
    `  ${index + 1}. ${name} (${slug}) - ${days} days until hard delete`,
  PROJECT_DELETED_ITEM: (index: number, name: string, slug: string, days: number) =>
    `  ${index + 1}. ${name} (${slug}) - ${days} days past grace period`,
  ERROR: (msg: string) => `[Grace Period Job] Error: ${msg}`,
} as const
