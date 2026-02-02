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
import { parseQueryParams } from './utils'
import { getUsageByService, getUsageByMetric, getTimeSeries, getQuotaInfo } from './queries'
import type { UsageResponse } from './types'

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
