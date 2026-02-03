/**
 * Grace Period Job Module - Cleanup Job
 */

import type { CleanupJobResult, GracePeriodStats } from './types'
import { LOG_PREFIXES } from './constants'
import {
  deleteExpiredSecrets,
  findExpiringSecrets,
  markWarningSent,
  countActiveSecrets,
  countGracePeriodSecrets,
  countExpiredSecrets,
  countExpiringSoonSecrets,
} from './queries'
import { sendExpirationWarningEmail } from './notifications'
import { logWarningSent, logJobExecution } from './audit'

/**
 * Run the grace period cleanup job
 *
 * This function:
 * 1. Deletes all inactive secrets where grace_period_ends_at < NOW()
 * 2. Sends warning emails for secrets expiring within 1 hour
 * 3. Logs all operations to audit log
 *
 * @returns Cleanup job result with counts and details
 */
export async function runGracePeriodCleanupJob(): Promise<CleanupJobResult> {
  const deletedSecrets: Array<{ id: string; name: string; version: number }> = []
  const warnedSecrets: Array<{ id: string; name: string; version: number; gracePeriodEndsAt: Date }> = []
  let deletedCount = 0
  let warningCount = 0

  try {
    console.log(LOG_PREFIXES.START)

    // Step 1: Delete expired secrets
    const expiredRows = await deleteExpiredSecrets()
    deletedCount = expiredRows.length

    for (const row of expiredRows) {
      deletedSecrets.push({
        id: row.id,
        name: row.name,
        version: row.version,
      })
      console.log(`${LOG_PREFIXES.DELETED}: ${row.name} v${row.version} (expired at ${row.grace_period_ends_at})`)
    }

    // Step 2: Find secrets expiring within warning threshold (1 hour)
    const warningRows = await findExpiringSecrets()
    warningCount = warningRows.length

    // Step 3: Send warning emails and log to audit
    for (const row of warningRows) {
      const secret = {
        id: row.id,
        project_id: row.project_id,
        name: row.name,
        version: row.version,
        grace_period_ends_at: row.grace_period_ends_at,
        project_owner_email: row.project_owner_email,
        project_name: row.project_name,
      }

      await sendExpirationWarningEmail(secret)
      warnedSecrets.push({
        id: secret.id,
        name: secret.name,
        version: secret.version,
        gracePeriodEndsAt: secret.grace_period_ends_at,
      })

      console.log(`${LOG_PREFIXES.WARNED}: ${secret.name} v${secret.version} (expires at ${secret.grace_period_ends_at})`)

      // Mark warning sent and log to audit
      await markWarningSent(secret.id)
      await logWarningSent(secret)
    }

    // Step 4: Log job execution to audit
    await logJobExecution(deletedCount, warningCount)

    console.log(`${LOG_PREFIXES.COMPLETE}: ${deletedCount} deleted, ${warningCount} warnings sent`)

    return {
      deletedCount,
      warningCount,
      deletedSecrets,
      warnedSecrets,
    }

  } catch (error) {
    console.error(LOG_PREFIXES.ERROR, error)
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
export async function getGracePeriodStats(): Promise<GracePeriodStats> {
  const [activeSecrets, inGracePeriod, expired, expiringSoon] = await Promise.all([
    countActiveSecrets(),
    countGracePeriodSecrets(),
    countExpiredSecrets(),
    countExpiringSoonSecrets(),
  ])

  return {
    activeSecrets,
    inGracePeriod,
    expired,
    expiringSoon,
  }
}
