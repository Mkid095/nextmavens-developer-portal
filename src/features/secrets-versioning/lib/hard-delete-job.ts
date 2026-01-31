/**
 * Hard Delete Job for Secrets
 * PRD: US-008 from prd-secrets-versioning.json
 *
 * Background job that permanently deletes secrets that have been soft-deleted
 * for more than 30 days. This ensures secrets are completely removed from the
 * database after the retention period.
 */

import { getPool } from '@/lib/db'

/**
 * Hard delete secrets that have been soft-deleted for more than 30 days
 *
 * This job:
 * 1. Finds all secrets where deleted_at > 30 days ago
 * 2. Permanently deletes them from the database
 * 3. Logs the number of secrets deleted
 *
 * @returns The number of secrets hard-deleted
 */
export async function runHardDeleteJob(): Promise<number> {
  const pool = getPool()

  try {
    // Hard delete secrets that were soft-deleted more than 30 days ago
    const retentionDays = 30

    const result = await pool.query(
      `DELETE FROM control_plane.secrets
       WHERE deleted_at IS NOT NULL
         AND deleted_at < NOW() - INTERVAL '${retentionDays} days'
       RETURNING id, project_id, name, version, deleted_at`,
    )

    const deletedCount = result.rows.length

    if (deletedCount > 0) {
      console.log(`[Hard Delete Job] Permanently deleted ${deletedCount} secret(s) older than ${retentionDays} days`)

      // Log details of deleted secrets (without values - US-011 compliance)
      for (const secret of result.rows) {
        console.log(`[Hard Delete Job] Deleted secret:`, {
          secretId: secret.id,
          secretName: secret.name,
          projectId: secret.project_id,
          version: secret.version,
          softDeletedAt: secret.deleted_at,
          retentionDays,
        })
      }
    }

    return deletedCount
  } catch (error) {
    console.error('[Hard Delete Job] Failed to hard delete secrets:', error)
    throw error
  }
}

/**
 * Get statistics about soft-deleted secrets pending hard deletion
 *
 * @returns Statistics about pending hard deletions
 */
export async function getHardDeleteStats(): Promise<{
  pendingDeletion: number
  deletedInLast7Days: number
  deletedInLast30Days: number
  deletedOver30Days: number
}> {
  const pool = getPool()

  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE deleted_at >= NOW() - INTERVAL '7 days') as deleted_in_last_7_days,
        COUNT(*) FILTER (WHERE deleted_at >= NOW() - INTERVAL '30 days') as deleted_in_last_30_days,
        COUNT(*) FILTER (WHERE deleted_at < NOW() - INTERVAL '30 days') as deleted_over_30_days,
        COUNT(*) as total_pending
      FROM control_plane.secrets
      WHERE deleted_at IS NOT NULL
    `)

    const row = result.rows[0]

    return {
      pendingDeletion: parseInt(row.total_pending, 10),
      deletedInLast7Days: parseInt(row.deleted_in_last_7_days, 10),
      deletedInLast30Days: parseInt(row.deleted_in_last_30_days, 10),
      deletedOver30Days: parseInt(row.deleted_over_30_days, 10),
    }
  } catch (error) {
    console.error('[Hard Delete Job] Failed to get hard delete stats:', error)
    throw error
  }
}

/**
 * Manually trigger hard delete for a specific secret (admin function)
 * Use with caution - this permanently deletes the secret immediately
 *
 * @param secretName - The name of the secret to hard delete
 * @param projectId - The project ID
 * @returns The number of secrets hard-deleted
 */
export async function hardDeleteSecret(
  secretName: string,
  projectId: string
): Promise<number> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `DELETE FROM control_plane.secrets
       WHERE project_id = $1 AND name = $2 AND deleted_at IS NOT NULL
       RETURNING id, version, deleted_at`,
      [projectId, secretName]
    )

    const deletedCount = result.rows.length

    console.log(`[Hard Delete Job] Manually hard-deleted ${deletedCount} version(s) of secret '${secretName}' in project ${projectId}`)

    return deletedCount
  } catch (error) {
    console.error('[Hard Delete Job] Failed to manually hard delete secret:', error)
    throw error
  }
}
