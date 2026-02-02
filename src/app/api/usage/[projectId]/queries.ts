/**
 * Usage API Database Queries
 */

import type { Aggregation } from './types'
import { getDateTrunc, buildWhereClause } from './utils'

/**
 * Get aggregated usage by service
 */
export async function getUsageByService(
  pool: any,
  projectId: string,
  startDate: Date,
  endDate: Date,
  filters: { service?: string; metric_type?: string }
): Promise<Array<{ service: string; total_quantity: number; metric_breakdown: any[] }>> {
  try {
    const baseConditions = ['project_id = $1', 'recorded_at >= $2', 'recorded_at <= $3']
    const baseParams: any[] = [projectId, startDate, endDate]
    let paramIndex = 4

    if (filters.service) {
      baseConditions.push(`service = $${paramIndex++}`)
      baseParams.push(filters.service)
    }

    const query = `
      SELECT
        service,
        SUM(quantity) as total_quantity
      FROM control_plane.usage_metrics
      WHERE ${baseConditions.join(' AND ')}
      GROUP BY service
      ORDER BY total_quantity DESC
    `

    const result = await pool.query(query, baseParams)

    // For each service, get metric breakdown
    const services = await Promise.all(
      result.rows.map(async (row: { service: string; total_quantity: string }) => {
        const metricConditions = [
          'project_id = $1',
          'service = $2',
          'recorded_at >= $3',
          'recorded_at <= $4'
        ]
        const metricParams: any[] = [projectId, row.service, startDate, endDate]
        let metricParamIndex = 5

        if (filters.metric_type) {
          metricConditions.push(`metric_type = $${metricParamIndex++}`)
          metricParams.push(filters.metric_type)
        }

        const metricQuery = `
          SELECT
            metric_type,
            SUM(quantity) as quantity
          FROM control_plane.usage_metrics
          WHERE ${metricConditions.join(' AND ')}
          GROUP BY metric_type
          ORDER BY quantity DESC
        `

        const metricResult = await pool.query(metricQuery, metricParams)

        return {
          service: row.service,
          total_quantity: parseInt(row.total_quantity) || 0,
          metric_breakdown: metricResult.rows.map((m: { metric_type: string; quantity: string }) => ({
            metric_type: m.metric_type,
            quantity: parseInt(m.quantity) || 0,
          })),
        }
      })
    )

    return services
  } catch (error) {
    console.error('[Usage Aggregation] Error getting usage by service:', error)
    return []
  }
}

/**
 * Get aggregated usage by metric type
 */
export async function getUsageByMetric(
  pool: any,
  projectId: string,
  startDate: Date,
  endDate: Date,
  filters: { service?: string; metric_type?: string }
): Promise<Array<{ metric_type: string; total_quantity: number }>> {
  try {
    const conditions: string[] = ['project_id = $1', 'recorded_at >= $2', 'recorded_at <= $3']
    const queryParams: any[] = [projectId, startDate, endDate]
    let paramIndex = 4

    if (filters.service) {
      conditions.push(`service = $${paramIndex++}`)
      queryParams.push(filters.service)
    }

    if (filters.metric_type) {
      conditions.push(`metric_type = $${paramIndex++}`)
      queryParams.push(filters.metric_type)
    }

    const query = `
      SELECT
        metric_type,
        SUM(quantity) as total_quantity
      FROM control_plane.usage_metrics
      WHERE ${conditions.join(' AND ')}
      GROUP BY metric_type
      ORDER BY total_quantity DESC
    `

    const result = await pool.query(query, queryParams)

    return result.rows.map((row: { metric_type: string; total_quantity: string }) => ({
      metric_type: row.metric_type,
      total_quantity: parseInt(row.total_quantity) || 0,
    }))
  } catch (error) {
    console.error('[Usage Aggregation] Error getting usage by metric:', error)
    return []
  }
}

/**
 * Get time series data for usage over time
 */
export async function getTimeSeries(
  pool: any,
  projectId: string,
  startDate: Date,
  endDate: Date,
  aggregation: Aggregation,
  filters: { service?: string; metric_type?: string }
): Promise<Array<{ period: string; service: string; metric_type: string; quantity: number }>> {
  try {
    const dateTrunc = getDateTrunc(aggregation)
    const conditions: string[] = ['project_id = $1', 'recorded_at >= $2', 'recorded_at <= $3']
    const queryParams: any[] = [projectId, startDate, endDate]
    let paramIndex = 4

    if (filters.service) {
      conditions.push(`service = $${paramIndex++}`)
      queryParams.push(filters.service)
    }

    if (filters.metric_type) {
      conditions.push(`metric_type = $${paramIndex++}`)
      queryParams.push(filters.metric_type)
    }

    const query = `
      SELECT
        ${dateTrunc} as period,
        service,
        metric_type,
        SUM(quantity) as quantity
      FROM control_plane.usage_metrics
      WHERE ${conditions.join(' AND ')}
      GROUP BY ${dateTrunc}, service, metric_type
      ORDER BY period DESC, service, metric_type
    `

    const result = await pool.query(query, queryParams)

    return result.rows.map((row: { period: string; service: string; metric_type: string; quantity: string }) => ({
      period: row.period,
      service: row.service,
      metric_type: row.metric_type,
      quantity: parseInt(row.quantity) || 0,
    }))
  } catch (error) {
    console.error('[Usage Aggregation] Error getting time series:', error)
    return []
  }
}

/**
 * Get quota information for a project
 */
export async function getQuotaInfo(
  pool: any,
  projectId: string,
  startDate: Date
): Promise<
  Array<{
    service: string
    current_usage: number
    monthly_limit: number
    hard_cap: number
    usage_percentage: number
    reset_at: string
  }>
> {
  try {
    // Get current usage from the start of the month
    const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)

    const usageQuery = `
      SELECT
        service,
        SUM(quantity) as current_usage
      FROM control_plane.usage_metrics
      WHERE project_id = $1
        AND recorded_at >= $2
      GROUP BY service
    `

    const usageResult = await pool.query(usageQuery, [projectId, startOfMonth])

    // Get quota configuration
    const quotaQuery = `
      SELECT
        service,
        monthly_limit,
        hard_cap,
        reset_at
      FROM control_plane.quotas
      WHERE project_id = $1
    `

    const quotaResult = await pool.query(quotaQuery, [projectId])

    // Merge usage and quota data
    type QuotaRow = { service: string; monthly_limit?: string; hard_cap?: string; reset_at?: string }
    const quotaMap = new Map<string, QuotaRow>(quotaResult.rows.map((q: QuotaRow) => [q.service, q]))

    return usageResult.rows.map((u: { service: string; current_usage: string }) => {
      const quota = quotaMap.get(u.service)
      const monthlyLimit = parseInt(quota?.monthly_limit || '0') || 0
      const hardCap = parseInt(quota?.hard_cap || '0') || 0
      const currentUsage = parseInt(u.current_usage) || 0
      const usagePercentage = monthlyLimit > 0 ? (currentUsage / monthlyLimit) * 100 : 0

      return {
        service: u.service,
        current_usage: currentUsage,
        monthly_limit: monthlyLimit,
        hard_cap: hardCap,
        usage_percentage: Math.round(usagePercentage * 100) / 100,
        reset_at: quota?.reset_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
    })
  } catch (error) {
    console.error('[Usage Aggregation] Error getting quota info:', error)
    return []
  }
}
