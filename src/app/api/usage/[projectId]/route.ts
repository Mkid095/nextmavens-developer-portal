/**
 * GET /api/usage/[projectId]
 *
 * Usage Aggregation API
 *
 * Query aggregated usage data for a project across all services.
 * Supports filtering by service, metric type, date range, and aggregation period.
 *
 * US-006: Create Usage Aggregation API (prd-usage-tracking.json)
 *
 * Query parameters:
 * - service: Filter by service (db, realtime, storage, auth, function)
 * - metric_type: Filter by metric type
 * - start_date: Start date for aggregation (ISO 8601 format)
 * - end_date: End date for aggregation (ISO 8601 format)
 * - aggregation: Aggregation period (day, week, month)
 * - days: Alternative to start_date - number of days to look back (default: 30)
 *
 * Returns:
 * - project_id: The project ID
 * - period: The aggregation period
 * - usage: Aggregated usage data
 * - quota: Quota information (if available)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { toErrorNextResponse, ErrorCode } from '@/lib/errors'

// Valid services and metrics from usage_metrics table
const VALID_SERVICES = ['db', 'realtime', 'storage', 'auth', 'function'] as const
const VALID_AGGREGATIONS = ['day', 'week', 'month'] as const

type Service = typeof VALID_SERVICES[number]
type Aggregation = typeof VALID_AGGREGATIONS[number]

interface UsageRequestParams {
  projectId: string
  service?: string
  metric_type?: string
  start_date?: string
  end_date?: string
  aggregation?: string
  days?: string
}

interface UsageResponse {
  project_id: string
  period: {
    start_date: string
    end_date: string
    aggregation: string
  }
  usage: {
    total_by_service: Array<{
      service: string
      total_quantity: number
      metric_breakdown: Array<{
        metric_type: string
        quantity: number
      }>
    }>
    total_by_metric: Array<{
      metric_type: string
      total_quantity: number
    }>
    time_series: Array<{
      period: string
      service: string
      metric_type: string
      quantity: number
    }>
  }
  quota?: Array<{
    service: string
    current_usage: number
    monthly_limit: number
    hard_cap: number
    usage_percentage: number
    reset_at: string
  }>
}

/**
 * Parse and validate query parameters
 */
function parseQueryParams(params: UsageRequestParams): {
  startDate: Date
  endDate: Date
  aggregation: Aggregation
  filters: { service?: string; metric_type?: string }
} {
  const now = new Date()
  let startDate: Date
  let endDate: Date = now
  let aggregation: Aggregation = 'day'
  const filters: { service?: string; metric_type?: string } = {}

  // Parse aggregation period
  if (params.aggregation && VALID_AGGREGATIONS.includes(params.aggregation as Aggregation)) {
    aggregation = params.aggregation as Aggregation
  }

  // Parse date range
  if (params.start_date) {
    startDate = new Date(params.start_date)
  } else if (params.days) {
    const days = parseInt(params.days) || 30
    startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Default 30 days
  }

  if (params.end_date) {
    endDate = new Date(params.end_date)
  }

  // Parse filters
  if (params.service && VALID_SERVICES.includes(params.service as Service)) {
    filters.service = params.service
  }

  if (params.metric_type) {
    filters.metric_type = params.metric_type
  }

  return { startDate, endDate, aggregation, filters }
}

/**
 * Get date truncation SQL for aggregation period
 */
function getDateTrunc(aggregation: Aggregation): string {
  switch (aggregation) {
    case 'day':
      return 'DATE(recorded_at)'
    case 'week':
      return 'DATE_TRUNC(\'week\', recorded_at)'
    case 'month':
      return 'DATE_TRUNC(\'month\', recorded_at)'
    default:
      return 'DATE(recorded_at)'
  }
}

/**
 * Get aggregated usage by service
 */
async function getUsageByService(
  pool: any,
  projectId: string,
  startDate: Date,
  endDate: Date,
  filters: { service?: string; metric_type?: string }
): Promise<Array<{ service: string; total_quantity: number; metric_breakdown: any[] }>> {
  try {
    const whereConditions: string[] = ['project_id = $1', 'recorded_at >= $2', 'recorded_at <= $3']
    const queryParams: any[] = [projectId, startDate, endDate]
    let paramIndex = 4

    if (filters.service) {
      whereConditions.push(`service = $${paramIndex++}`)
      queryParams.push(filters.service)
    }

    if (filters.metric_type) {
      whereConditions.push(`metric_type = $${paramIndex++}`)
      queryParams.push(filters.metric_type)
    }

    const query = `
      SELECT
        service,
        SUM(quantity) as total_quantity
      FROM control_plane.usage_metrics
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY service
      ORDER BY total_quantity DESC
    `

    const result = await pool.query(query, queryParams)

    // For each service, get metric breakdown
    const services = await Promise.all(
      result.rows.map(async (row: { service: string; total_quantity: string }) => {
        const metricWhereConditions: string[] = [
          'project_id = $1',
          'service = $2',
          'recorded_at >= $3',
          'recorded_at <= $4'
        ]
        const metricQueryParams: any[] = [projectId, row.service, startDate, endDate]
        let metricParamIndex = 5

        if (filters.metric_type) {
          metricWhereConditions.push(`metric_type = $${metricParamIndex++}`)
          metricQueryParams.push(filters.metric_type)
        }

        const metricQuery = `
          SELECT
            metric_type,
            SUM(quantity) as quantity
          FROM control_plane.usage_metrics
          WHERE ${metricWhereConditions.join(' AND ')}
          GROUP BY metric_type
          ORDER BY quantity DESC
        `

        const metricResult = await pool.query(metricQuery, metricQueryParams)

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
async function getUsageByMetric(
  pool: any,
  projectId: string,
  startDate: Date,
  endDate: Date,
  filters: { service?: string; metric_type?: string }
): Promise<Array<{ metric_type: string; total_quantity: number }>> {
  try {
    const whereConditions: string[] = ['project_id = $1', 'recorded_at >= $2', 'recorded_at <= $3']
    const queryParams: any[] = [projectId, startDate, endDate]
    let paramIndex = 4

    if (filters.service) {
      whereConditions.push(`service = $${paramIndex++}`)
      queryParams.push(filters.service)
    }

    if (filters.metric_type) {
      whereConditions.push(`metric_type = $${paramIndex++}`)
      queryParams.push(filters.metric_type)
    }

    const query = `
      SELECT
        metric_type,
        SUM(quantity) as total_quantity
      FROM control_plane.usage_metrics
      WHERE ${whereConditions.join(' AND ')}
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
async function getTimeSeries(
  pool: any,
  projectId: string,
  startDate: Date,
  endDate: Date,
  aggregation: Aggregation,
  filters: { service?: string; metric_type?: string }
): Promise<Array<{ period: string; service: string; metric_type: string; quantity: number }>> {
  try {
    const dateTrunc = getDateTrunc(aggregation)
    const whereConditions: string[] = ['project_id = $1', 'recorded_at >= $2', 'recorded_at <= $3']
    const queryParams: any[] = [projectId, startDate, endDate]
    let paramIndex = 4

    if (filters.service) {
      whereConditions.push(`service = $${paramIndex++}`)
      queryParams.push(filters.service)
    }

    if (filters.metric_type) {
      whereConditions.push(`metric_type = $${paramIndex++}`)
      queryParams.push(filters.metric_type)
    }

    const query = `
      SELECT
        ${dateTrunc} as period,
        service,
        metric_type,
        SUM(quantity) as quantity
      FROM control_plane.usage_metrics
      WHERE ${whereConditions.join(' AND ')}
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
async function getQuotaInfo(
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

/**
 * GET handler for usage aggregation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    // Validate projectId
    if (!projectId) {
      return toErrorNextResponse({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'projectId is required',
      })
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const queryParams = parseQueryParams({
      projectId,
      service: searchParams.get('service') || undefined,
      metric_type: searchParams.get('metric_type') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      aggregation: searchParams.get('aggregation') || undefined,
      days: searchParams.get('days') || undefined,
    })

    const pool = getPool()

    // Check if project exists
    const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId])

    if (projectCheck.rows.length === 0) {
      return toErrorNextResponse({
        code: ErrorCode.NOT_FOUND,
        message: 'Project not found',
      })
    }

    // Get all usage data in parallel
    const [usageByService, usageByMetric, timeSeries, quotaInfo] = await Promise.all([
      getUsageByService(pool, projectId, queryParams.startDate, queryParams.endDate, queryParams.filters),
      getUsageByMetric(pool, projectId, queryParams.startDate, queryParams.endDate, queryParams.filters),
      getTimeSeries(pool, projectId, queryParams.startDate, queryParams.endDate, queryParams.aggregation, queryParams.filters),
      getQuotaInfo(pool, projectId, queryParams.startDate),
    ])

    const response: UsageResponse = {
      project_id: projectId,
      period: {
        start_date: queryParams.startDate.toISOString(),
        end_date: queryParams.endDate.toISOString(),
        aggregation: queryParams.aggregation,
      },
      usage: {
        total_by_service: usageByService,
        total_by_metric: usageByMetric,
        time_series: timeSeries,
      },
    }

    // Add quota info if available
    if (quotaInfo.length > 0) {
      response.quota = quotaInfo
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Usage Aggregation] Error:', error)
    return toErrorNextResponse({
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message || 'Failed to get usage data',
    })
  }
}
