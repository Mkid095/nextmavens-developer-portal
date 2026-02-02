/**
 * Realtime Usage Statistics
 */

import { getPool } from '@/lib/db'
import type {
  RealtimeUsageStatsResult,
  RealtimeUsageStatsData,
  CurrentRealtimeUsageResult,
  CurrentHourConnectionResult,
} from './types'

export async function getRealtimeUsageStats(
  projectId: string,
  startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  endDate: Date = new Date()
): Promise<RealtimeUsageStatsResult> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `SELECT
         SUM(CASE WHEN metric_type = 'realtime_message' THEN quantity ELSE 0 END) as realtime_message_count,
         SUM(CASE WHEN metric_type = 'realtime_connection' THEN quantity ELSE 0 END) as realtime_connection_count
       FROM control_plane.usage_metrics
       WHERE project_id = $1 AND service = 'realtime' AND recorded_at >= $2 AND recorded_at <= $3`,
      [projectId, startDate, endDate]
    )

    const row = result.rows[0]
    const messageCount = parseInt(row.realtime_message_count) || 0
    const connectionCount = parseInt(row.realtime_connection_count) || 0

    const breakdownResult = await pool.query(
      `SELECT
         DATE(recorded_at) as date,
         SUM(CASE WHEN metric_type = 'realtime_message' THEN quantity ELSE 0 END) as realtime_message_count,
         SUM(CASE WHEN metric_type = 'realtime_connection' THEN quantity ELSE 0 END) as realtime_connection_count
       FROM control_plane.usage_metrics
       WHERE project_id = $1 AND service = 'realtime' AND recorded_at >= $2 AND recorded_at <= $3
       GROUP BY DATE(recorded_at) ORDER BY date DESC`,
      [projectId, startDate, endDate]
    )

    const breakdownByDay = breakdownResult.rows.map(row => ({
      date: row.date,
      messageCount: parseInt(row.realtime_message_count) || 0,
      connectionCount: parseInt(row.realtime_connection_count) || 0,
    }))

    const hourlyBreakdownResult = await pool.query(
      `SELECT
         DATE_TRUNC('hour', recorded_at) as hour,
         SUM(CASE WHEN metric_type = 'realtime_message' THEN quantity ELSE 0 END) as realtime_message_count,
         SUM(CASE WHEN metric_type = 'realtime_connection' THEN quantity ELSE 0 END) as realtime_connection_count
       FROM control_plane.usage_metrics
       WHERE project_id = $1 AND service = 'realtime' AND recorded_at >= $2 AND recorded_at <= $3
       GROUP BY DATE_TRUNC('hour', recorded_at) ORDER BY hour DESC LIMIT 168`,
      [projectId, startDate, endDate]
    )

    const breakdownByHour = hourlyBreakdownResult.rows.map(row => ({
      hour: row.hour,
      messageCount: parseInt(row.realtime_message_count) || 0,
      connectionCount: parseInt(row.realtime_connection_count) || 0,
    }))

    return {
      success: true,
      data: {
        messageCount,
        connectionCount,
        breakdownByDay,
        breakdownByHour,
      },
    }
  } catch (error: any) {
    console.error('[RealtimeUsageTracking] Error getting realtime usage stats:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function getCurrentRealtimeUsage(projectId: string): Promise<CurrentRealtimeUsageResult> {
  const stats = await getRealtimeUsageStats(projectId)

  if (!stats.success || !stats.data) {
    return stats
  }

  return {
    success: true,
    data: {
      messageCount: stats.data.messageCount,
      connectionCount: stats.data.connectionCount,
    },
  }
}

export async function getCurrentHourConnectionCount(projectId: string): Promise<CurrentHourConnectionResult> {
  const pool = getPool()

  try {
    const startOfHour = new Date()
    startOfHour.setMinutes(0, 0, 0)

    const result = await pool.query(
      `SELECT COALESCE(SUM(quantity), 0) as connection_count
       FROM control_plane.usage_metrics
       WHERE project_id = $1 AND service = 'realtime'
         AND metric_type = 'realtime_connection' AND recorded_at >= $2`,
      [projectId, startOfHour]
    )

    const connectionCount = parseInt(result.rows[0].connection_count) || 0

    return {
      success: true,
      data: { connectionCount },
    }
  } catch (error: any) {
    console.error('[RealtimeUsageTracking] Error getting current hour connection count:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
