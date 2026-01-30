/**
 * Grace Period Cleanup Job for Secret Versions
 * PRD: US-006 from prd-secrets-versioning.json
 *
 * This job handles:
 * 1. Deleting old secret versions after their grace period expires (24 hours)
 * 2. Sending warning emails 1 hour before expiration
 * 3. Logging cleanup operations to audit log
 */

import { getPool } from '@/lib/db'

// ============================================================================
// Constants
// ============================================================================

/** Grace period duration in hours (24 hours) */
export const GRACE_PERIOD_HOURS = 24

/** Warning threshold before expiration (1 hour) */
export const WARNING_THRESHOLD_HOURS = 1

// ============================================================================
// Types
// ============================================================================

export interface ExpiredSecret {
  id: string
  project_id: string
  name: string
  version: number
  expires_at: Date
}

export interface ExpiringSecret {
  id: string
  project_id: string
  name: string
  version: number
  expires_at: Date
  project_owner_email?: string
  project_name?: string
}

export interface CleanupJobResult {
  /** Number of expired secrets deleted */
  deletedCount: number
  /** Number of warning emails sent */
  warningCount: number
  /** List of deleted secret IDs */
  deletedSecrets: Array<{ id: string; name: string; version: number }>
  /** List of secrets that were warned about */
  warnedSecrets: Array<{ id: string; name: string; version: number; expiresAt: Date }>
  /** Error if any */
  error?: string
}

// ============================================================================
// Cleanup Functions
// ============================================================================

/**
 * Run the grace period cleanup job
 *
 * This function:
 * 1. Deletes all inactive secrets where expires_at < NOW()
 * 2. Sends warning emails for secrets expiring within 1 hour
 * 3. Logs all operations to audit log
 *
 * @returns Cleanup job result with counts and details
 */
export async function runGracePeriodCleanupJob(): Promise<CleanupJobResult> {
  const pool = getPool()
  const deletedSecrets: Array<{ id: string; name: string; version: number }> = []
  const warnedSecrets: Array<{ id: string; name: string; version: number; expiresAt: Date }> = []
  let deletedCount = 0
  let warningCount = 0

  try {
    console.log('[GracePeriodJob] Starting grace period cleanup job')

    // Step 1: Delete expired secrets
    const expiredResult = await pool.query(
      `DELETE FROM control_plane.secrets
       WHERE active = FALSE
         AND expires_at IS NOT NULL
         AND expires_at < NOW()
       RETURNING id, project_id, name, version, expires_at`
    )

    deletedCount = expiredResult.rows.length
    for (const row of expiredResult.rows) {
      deletedSecrets.push({
        id: row.id,
        name: row.name,
        version: row.version,
      })
      console.log(`[GracePeriodJob] Deleted expired secret: ${row.name} v${row.version} (expired at ${row.expires_at})`)
    }

    // Step 2: Find secrets expiring within warning threshold (1 hour)
    const warningResult = await pool.query(
      `SELECT
        s.id, s.project_id, s.name, s.version, s.expires_at,
        p.name as project_name,
        d.email as project_owner_email
       FROM control_plane.secrets s
       INNER JOIN control_plane.projects p ON s.project_id = p.id
       INNER JOIN control_plane.developers d ON p.owner_id = d.id
       WHERE s.active = FALSE
         AND s.expires_at IS NOT NULL
         AND s.expires_at > NOW()
         AND s.expires_at <= NOW() + INTERVAL '${WARNING_THRESHOLD_HOURS} hours'
       ORDER BY s.expires_at ASC`
    )

    warningCount = warningResult.rows.length

    // Step 3: Send warning emails and log to audit
    for (const row of warningResult.rows) {
      const secret: ExpiringSecret = {
        id: row.id,
        project_id: row.project_id,
        name: row.name,
        version: row.version,
        expires_at: row.expires_at,
        project_owner_email: row.project_owner_email,
        project_name: row.project_name,
      }

      await sendExpirationWarningEmail(secret)
      warnedSecrets.push({
        id: secret.id,
        name: secret.name,
        version: secret.version,
        expiresAt: secret.expires_at,
      })

      console.log(`[GracePeriodJob] Sent warning for expiring secret: ${secret.name} v${secret.version} (expires at ${secret.expires_at})`)

      // Log to audit
      await logWarningSent(secret)
    }

    // Step 4: Log job execution to audit
    await logJobExecution(deletedCount, warningCount)

    console.log(`[GracePeriodJob] Cleanup complete: ${deletedCount} deleted, ${warningCount} warnings sent`)

    return {
      deletedCount,
      warningCount,
      deletedSecrets,
      warnedSecrets,
    }

  } catch (error) {
    console.error('[GracePeriodJob] Error running cleanup job:', error)
    return {
      deletedCount,
      warningCount,
      deletedSecrets,
      warnedSecrets,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get statistics about secrets in grace period
 *
 * @returns Statistics about expiring and expired secrets
 */
export async function getGracePeriodStats(): Promise<{
  activeSecrets: number
  inGracePeriod: number
  expired: number
  expiringSoon: number
}> {
  const pool = getPool()

  // Count active secrets
  const activeResult = await pool.query(
    `SELECT COUNT(*) as count FROM control_plane.secrets WHERE active = TRUE`
  )

  // Count secrets in grace period (inactive, not expired)
  const gracePeriodResult = await pool.query(
    `SELECT COUNT(*) as count
     FROM control_plane.secrets
     WHERE active = FALSE
       AND expires_at IS NOT NULL
       AND expires_at > NOW()`
  )

  // Count expired secrets (should be deleted)
  const expiredResult = await pool.query(
    `SELECT COUNT(*) as count
     FROM control_plane.secrets
     WHERE active = FALSE
       AND expires_at IS NOT NULL
       AND expires_at < NOW()`
  )

  // Count secrets expiring soon (within 1 hour)
  const expiringSoonResult = await pool.query(
    `SELECT COUNT(*) as count
     FROM control_plane.secrets
     WHERE active = FALSE
       AND expires_at IS NOT NULL
       AND expires_at > NOW()
       AND expires_at <= NOW() + INTERVAL '1 hour'`
  )

  return {
    activeSecrets: parseInt(activeResult.rows[0].count, 10),
    inGracePeriod: parseInt(gracePeriodResult.rows[0].count, 10),
    expired: parseInt(expiredResult.rows[0].count, 10),
    expiringSoon: parseInt(expiringSoonResult.rows[0].count, 10),
  }
}

// ============================================================================
// Notification Functions
// ============================================================================

/**
 * Send expiration warning email for a secret about to expire
 *
 * @param secret - The expiring secret with project details
 */
async function sendExpirationWarningEmail(secret: ExpiringSecret): Promise<void> {
  // Import email service dynamically to avoid circular dependencies
  const { sendHtmlEmail } = await import('@/lib/email')

  const expiresAt = new Date(secret.expires_at)
  const timeUntilExpiration = expiresAt.getTime() - Date.now()
  const minutesUntilExpiration = Math.floor(timeUntilExpiration / (1000 * 60))

  const subject = `Secret "${secret.name}" will expire in ${minutesUntilExpiration} minutes`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Secret Expiring Soon</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
        <h2 style="color: #92400e; margin: 0 0 10px 0;">⚠️ Secret Expiring Soon</h2>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 8px;">
        <p>Hello,</p>
        <p>This is a reminder that an old version of your secret is about to be permanently deleted.</p>
        <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Project:</strong> ${secret.project_name || 'Unknown'}</p>
          <p style="margin: 0 0 10px 0;"><strong>Secret Name:</strong> ${secret.name}</p>
          <p style="margin: 0 0 10px 0;"><strong>Version:</strong> ${secret.version}</p>
          <p style="margin: 0;"><strong>Expires At:</strong> ${expiresAt.toLocaleString()}</p>
        </div>
        <p><strong>What happens next:</strong></p>
        <ul style="margin: 20px 0; padding-left: 20px;">
          <li>The old secret version will be <strong>permanently deleted</strong> at ${expiresAt.toLocaleString()}</li>
          <li>The current active version will not be affected</li>
          <li>All services should have been updated to use the new version</li>
        </ul>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          If you have any questions, please contact support.
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>NextMavens Developer Portal - Secret Grace Period</p>
      </div>
    </body>
    </html>
  `

  const text = `
Secret Expiring Soon

Hello,

This is a reminder that an old version of your secret is about to be permanently deleted.

Project: ${secret.project_name || 'Unknown'}
Secret Name: ${secret.name}
Version: ${secret.version}
Expires At: ${expiresAt.toLocaleString()}

What happens next:
- The old secret version will be permanently deleted at ${expiresAt.toLocaleString()}
- The current active version will not be affected
- All services should have been updated to use the new version

If you have any questions, please contact support.
  `

  if (secret.project_owner_email) {
    await sendHtmlEmail(
      secret.project_owner_email,
      subject,
      html,
      text
    )
  } else {
    console.warn(`[GracePeriodJob] No email address for project owner, skipping warning for secret ${secret.name}`)
  }
}

// ============================================================================
// Audit Logging Functions
// ============================================================================

/**
 * Log warning sent to audit log
 *
 * @param secret - The secret that warning was sent for
 */
async function logWarningSent(secret: ExpiringSecret): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `INSERT INTO control_plane.audit_logs
        (actor_id, actor_type, action, target_type, target_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        'system',
        'system',
        'secret.expiration_warning_sent',
        'secret',
        secret.id,
        JSON.stringify({
          secret_name: secret.name,
          secret_version: secret.version,
          project_id: secret.project_id,
          expires_at: secret.expires_at,
        }),
      ]
    )
  } catch (error) {
    console.error('[GracePeriodJob] Failed to log warning sent:', error)
  }
}

/**
 * Log job execution to audit log
 *
 * @param deletedCount - Number of secrets deleted
 * @param warningCount - Number of warnings sent
 */
async function logJobExecution(deletedCount: number, warningCount: number): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `INSERT INTO control_plane.audit_logs
        (actor_id, actor_type, action, target_type, target_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        'system',
        'system',
        'secret.grace_period_cleanup_executed',
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
    console.error('[GracePeriodJob] Failed to log job execution:', error)
  }
}
