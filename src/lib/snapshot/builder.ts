/**
 * Snapshot Builder
 *
 * Builds control plane snapshots by aggregating project state from multiple sources.
 * This is the authoritative source of truth for data plane services.
 *
 * All errors are propagated as fail-closed errors - data plane services MUST deny
 * requests when snapshot generation fails.
 */

import { getPool } from '@/lib/db'
import { QuotaManager } from '@/features/abuse-controls/lib/data-layer'
import { ControlPlaneSnapshot, SnapshotProject, Services, RateLimit, Quotas } from './types'
import { getSnapshotVersion } from './cache'
import {
  DatabaseConnectionError,
  SnapshotBuildError,
  ProjectNotFoundError,
  QuotaServiceUnavailableError,
} from './errors'

/**
 * Generate a version string for the snapshot
 * Uses the version counter from the cache, which increments on project changes
 */
function generateVersion(projectId: string): string {
  const version = getSnapshotVersion(projectId)
  return `v${version}`
}

/**
 * Get project basic information
 * @throws DatabaseConnectionError if database is unavailable
 * @throws ProjectNotFoundError if project doesn't exist
 */
async function getProjectInfo(projectId: string): Promise<SnapshotProject> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `SELECT
        id,
        status,
        tenant_id,
        created_at,
        updated_at
       FROM projects
       WHERE id = $1`,
      [projectId]
    )

    if (result.rows.length === 0) {
      throw new ProjectNotFoundError(projectId)
    }

    const row = result.rows[0]

    // Determine environment from tenant (this is a simplification)
    // In a real implementation, you'd have an environment field
    const environment: 'development' | 'staging' | 'production' = 'production'

    return {
      id: row.id,
      status: row.status.toUpperCase(),
      environment,
      tenant_id: row.tenant_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      throw error
    }

    // Database connection errors - fail closed
    console.error('[Snapshot Builder] Database error fetching project info:', error)
    throw new DatabaseConnectionError(
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Get services configuration for a project
 * For now, all services are enabled by default
 * In a real implementation, this would come from a project_services table
 */
async function getServicesConfig(projectId: string): Promise<Services> {
  // Default: all services enabled
  // In a real implementation, you'd query a project_services table
  return {
    auth: { enabled: true },
    graphql: { enabled: true },
    realtime: { enabled: true },
    storage: { enabled: true },
    database: { enabled: true },
    functions: { enabled: true },
  }
}

/**
 * Get rate limits for a project
 * @throws DatabaseConnectionError if database is unavailable
 */
async function getRateLimits(projectId: string): Promise<RateLimit> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `SELECT rate_limit FROM projects WHERE id = $1`,
      [projectId]
    )

    if (result.rows.length === 0) {
      // Return default rate limits
      return {
        requests_per_minute: 60,
        requests_per_hour: 1000,
        requests_per_day: 10000,
      }
    }

    const rateLimit = result.rows[0].rate_limit || 10000

    // Convert daily rate limit to per-minute and per-hour
    return {
      requests_per_minute: Math.floor(rateLimit / 1440), // 1440 minutes in a day
      requests_per_hour: Math.floor(rateLimit / 24), // 24 hours in a day
      requests_per_day: rateLimit,
    }
  } catch (error) {
    console.error('[Snapshot Builder] Database error fetching rate limits:', error)
    // Fail closed on database errors
    throw new DatabaseConnectionError(
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Get hard quota limits for a project
 * @throws QuotaServiceUnavailableError if quota service is unavailable
 */
async function getHardQuotas(projectId: string): Promise<Quotas> {
  try {
    const quotas = await QuotaManager.getQuotas(projectId)

    // Build quotas object from quota records
    const quotaMap = new Map(
      quotas.map((q) => [q.cap_type.toLowerCase().replace(/_/g, '_'), q.cap_value])
    )

    return {
      db_queries_per_day:
        quotaMap.get('db_queries_per_day') || quotaMap.get('db-queries-per-day') || 10000,
      realtime_connections:
        quotaMap.get('realtime_connections') || quotaMap.get('realtime-connections') || 100,
      storage_uploads_per_day:
        quotaMap.get('storage_uploads_per_day') || quotaMap.get('storage-uploads-per-day') || 1000,
      function_invocations_per_day:
        quotaMap.get('function_invocations_per_day') ||
        quotaMap.get('function-invocations-per-day') ||
        5000,
    }
  } catch (error) {
    console.error('[Snapshot Builder] Error fetching hard quotas:', error)
    // Fail closed on quota service errors
    throw new QuotaServiceUnavailableError(
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Build a complete control plane snapshot for a project
 * @throws ProjectNotFoundError if project doesn't exist (404)
 * @throws ControlPlaneUnavailableError if control plane is down (503)
 * @throws SnapshotBuildError if snapshot generation fails (503)
 */
export async function buildSnapshot(projectId: string): Promise<ControlPlaneSnapshot> {
  try {
    // Get project information
    const project = await getProjectInfo(projectId)

    // Get services configuration
    const services = await getServicesConfig(projectId)

    // Get rate limits
    const limits = await getRateLimits(projectId)

    // Get hard quotas
    const quotas = await getHardQuotas(projectId)

    // Build snapshot
    const snapshot: ControlPlaneSnapshot = {
      version: generateVersion(projectId),
      project,
      services,
      limits,
      quotas,
    }

    return snapshot
  } catch (error) {
    // Re-throw known errors
    if (
      error instanceof ProjectNotFoundError ||
      error instanceof DatabaseConnectionError ||
      error instanceof QuotaServiceUnavailableError
    ) {
      throw error
    }

    // Unknown errors - fail closed
    console.error('[Snapshot Builder] Unexpected error building snapshot:', error)
    throw new SnapshotBuildError(
      'Unexpected error during snapshot generation',
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Build snapshots for multiple projects (batch operation)
 */
export async function buildSnapshots(projectIds: string[]): Promise<Map<string, ControlPlaneSnapshot>> {
  const snapshots = new Map<string, ControlPlaneSnapshot>()

  for (const projectId of projectIds) {
    try {
      const snapshot = await buildSnapshot(projectId)
      if (snapshot) {
        snapshots.set(projectId, snapshot)
      }
    } catch (error) {
      console.error(`[Snapshot Builder] Error building snapshot for project ${projectId}:`, error)
    }
  }

  return snapshots
}
