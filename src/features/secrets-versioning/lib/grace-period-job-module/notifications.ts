/**
 * Grace Period Job Module - Notifications
 */

import type { ExpiringSecret } from './types'
import { LOG_PREFIXES } from './constants'

/**
 * Send expiration warning email for a secret about to expire
 *
 * @param secret - The expiring secret with project details
 */
export async function sendExpirationWarningEmail(secret: ExpiringSecret): Promise<void> {
  const expiresAt = new Date(secret.grace_period_ends_at)
  const timeUntilExpiration = expiresAt.getTime() - Date.now()
  const minutesUntilExpiration = Math.floor(timeUntilExpiration / (1000 * 60))

  console.log(`${LOG_PREFIXES.STATS} Would send expiration warning email for secret "${secret.name}" (expires in ${minutesUntilExpiration} minutes)`)

  // TODO: Implement email service
  // const { sendHtmlEmail } = await import('@/lib/email')
  // const subject = `Secret "${secret.name}" will expire in ${minutesUntilExpiration} minutes`
  // await sendHtmlEmail(secret.project_owner_email, subject, html, text)
}
