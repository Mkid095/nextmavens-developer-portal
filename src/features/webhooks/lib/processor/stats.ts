/**
 * Webhook Delivery Statistics
 */

import { getPool } from '@/lib/db'

/**
 * Webhook delivery statistics
 */
export interface WebhookDeliveryStats {
  totalEvents: number
  delivered: number
  failed: number
  pending: number
  disabledWebhooks: number
}

/**
 * Get webhook delivery statistics
 *
 * @param hours - Number of hours to look back (default: 24)
 * @returns Summary of webhook delivery statistics
 */
export async function getWebhookDeliveryStats(hours: number = 24): Promise<WebhookDeliveryStats> {
  const pool = getPool()

  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    // Get event counts by status
    const statsResult = await pool.query(
      `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending
      FROM control_plane.event_log
      WHERE created_at >= $1
      `,
      [since]
    )

    // Get disabled webhooks count
    const disabledResult = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM control_plane.webhooks
      WHERE enabled = false
      `
    )

    return {
      totalEvents: parseInt(statsResult.rows[0].total, 10),
      delivered: parseInt(statsResult.rows[0].delivered, 10),
      failed: parseInt(statsResult.rows[0].failed, 10),
      pending: parseInt(statsResult.rows[0].pending, 10),
      disabledWebhooks: parseInt(disabledResult.rows[0].count, 10),
    }
  } catch (error) {
    console.error('[Webhook Processor] Error getting stats:', error)
    return {
      totalEvents: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      disabledWebhooks: 0,
    }
  }
}
