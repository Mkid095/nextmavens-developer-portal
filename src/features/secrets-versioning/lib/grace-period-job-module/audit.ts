/**
 * Grace Period Job Module - Audit Logging
 */

import { getPool } from '@/lib/db'
import type { ExpiringSecret } from './types'
import { AUDIT_ACTOR, AUDIT_ACTIONS, GRACE_PERIOD_HOURS, WARNING_THRESHOLD_HOURS, LOG_PREFIXES } from './constants'

/**
 * Log warning sent to audit log
 *
 * @param secret - The secret that warning was sent for
 */
export async function logWarningSent(secret: ExpiringSecret): Promise<void> {
  const pool = getPool()

  try {
    // Update the secret to mark that warning was sent
    await pool.query(
      `UPDATE control_plane.secrets
       SET grace_period_warning_sent_at = NOW()
       WHERE id = $1`,
      [secret.id]
    )

    // Log to audit_logs
    await pool.query(
      `INSERT INTO control_plane.audit_logs
        (actor_id, actor_type, action, target_type, target_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        AUDIT_ACTOR.id,
        AUDIT_ACTOR.type,
        AUDIT_ACTIONS.WARNING_SENT,
        'secret',
        secret.id,
        JSON.stringify({
          secret_name: secret.name,
          secret_version: secret.version,
          project_id: secret.project_id,
          grace_period_ends_at: secret.grace_period_ends_at,
        }),
      ]
    )
  } catch (error) {
    console.error(LOG_PREFIXES.LOG_WARNING_ERROR, error)
  }
}

/**
 * Log job execution to audit log
 *
 * @param deletedCount - Number of secrets deleted
 * @param warningCount - Number of warnings sent
 */
export async function logJobExecution(deletedCount: number, warningCount: number): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `INSERT INTO control_plane.audit_logs
        (actor_id, actor_type, action, target_type, target_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        AUDIT_ACTOR.id,
        AUDIT_ACTOR.type,
        AUDIT_ACTIONS.CLEANUP_EXECUTED,
        'system',
        'grace_period_job',
        JSON.stringify({
          deleted_count: deletedCount,
          warning_count: warningCount,
          grace_period_hours: GRACE_PERIOD_HOURS,
          warning_threshold_hours: WARNING_THRESHOLD_HOURS,
        }),
      ]
    )
  } catch (error) {
    console.error(LOG_PREFIXES.LOG_JOB_ERROR, error)
  }
}
