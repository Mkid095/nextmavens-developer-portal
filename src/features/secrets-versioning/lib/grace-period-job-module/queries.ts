/**
 * Grace Period Job Module - Database Queries
 */

import { getPool } from '@/lib/db'
import type { SecretQueryResult, CountResult } from './types'
import { WARNING_THRESHOLD_HOURS } from './constants'

/**
 * Delete expired secrets and return them
 */
export async function deleteExpiredSecrets(): Promise<SecretQueryResult[]> {
  const pool = getPool()
  const result = await pool.query(
    `DELETE FROM control_plane.secrets
     WHERE active = FALSE
       AND grace_period_ends_at IS NOT NULL
       AND grace_period_ends_at < NOW()
     RETURNING id, project_id, name, version, grace_period_ends_at`
  )
  return result.rows
}

/**
 * Find secrets expiring within warning threshold
 */
export async function findExpiringSecrets(): Promise<SecretQueryResult[]> {
  const pool = getPool()
  const result = await pool.query(
    `SELECT
      s.id, s.project_id, s.name, s.version, s.grace_period_ends_at,
      p.name as project_name,
      d.email as project_owner_email
     FROM control_plane.secrets s
     INNER JOIN control_plane.projects p ON s.project_id = p.id
     INNER JOIN control_plane.developers d ON p.owner_id = d.id
     WHERE s.active = FALSE
       AND s.grace_period_ends_at IS NOT NULL
       AND s.grace_period_ends_at > NOW()
       AND s.grace_period_ends_at <= NOW() + INTERVAL '${WARNING_THRESHOLD_HOURS} hours'
       AND s.grace_period_warning_sent_at IS NULL
     ORDER BY s.grace_period_ends_at ASC`
  )
  return result.rows
}

/**
 * Count active secrets
 */
export async function countActiveSecrets(): Promise<number> {
  const pool = getPool()
  const result = await pool.query<CountResult>(
    `SELECT COUNT(*) as count FROM control_plane.secrets WHERE active = TRUE`
  )
  return parseInt(result.rows[0].count, 10)
}

/**
 * Count secrets in grace period
 */
export async function countGracePeriodSecrets(): Promise<number> {
  const pool = getPool()
  const result = await pool.query<CountResult>(
    `SELECT COUNT(*) as count
     FROM control_plane.secrets
     WHERE active = FALSE
       AND grace_period_ends_at IS NOT NULL
       AND grace_period_ends_at > NOW()`
  )
  return parseInt(result.rows[0].count, 10)
}

/**
 * Count expired secrets
 */
export async function countExpiredSecrets(): Promise<number> {
  const pool = getPool()
  const result = await pool.query<CountResult>(
    `SELECT COUNT(*) as count
     FROM control_plane.secrets
     WHERE active = FALSE
       AND grace_period_ends_at IS NOT NULL
       AND grace_period_ends_at < NOW()`
  )
  return parseInt(result.rows[0].count, 10)
}

/**
 * Count secrets expiring soon
 */
export async function countExpiringSoonSecrets(): Promise<number> {
  const pool = getPool()
  const result = await pool.query<CountResult>(
    `SELECT COUNT(*) as count
     FROM control_plane.secrets
     WHERE active = FALSE
       AND grace_period_ends_at IS NOT NULL
       AND grace_period_ends_at > NOW()
       AND grace_period_ends_at <= NOW() + INTERVAL '1 hour'`
  )
  return parseInt(result.rows[0].count, 10)
}

/**
 * Mark warning as sent for a secret
 */
export async function markWarningSent(secretId: string): Promise<void> {
  const pool = getPool()
  await pool.query(
    `UPDATE control_plane.secrets
     SET grace_period_warning_sent_at = NOW()
     WHERE id = $1`,
    [secretId]
  )
}
