/**
 * GET /api/usage/[projectId]/export
 *
 * Usage Data Export API
 *
 * Exports usage data to CSV format for external analysis.
 *
 * US-008: Export Usage Data (prd-usage-tracking.json)
 *
 * Query parameters:
 * - start_date: Start date for export (ISO 8601 format)
 * - end_date: End date for export (ISO 8601 format)
 * - service: Filter by service (optional)
 * - metric_type: Filter by metric type (optional)
 * - days: Number of days to look back (alternative to start_date)
 *
 * Returns:
 * - CSV file download with usage data
 * - Headers: date, service, metric_type, quantity
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateUsageExportCSV } from '@/lib/usage/export'
import { toErrorNextResponse, ErrorCode } from '@/lib/errors'

/**
 * GET handler for usage data export
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
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const service = searchParams.get('service')
    const metric_type = searchParams.get('metric_type')
    const days = searchParams.get('days')

    // Build export options
    const options: any = {
      projectId,
    }

    if (start_date) {
      options.startDate = new Date(start_date)
    } else if (days) {
      const daysNum = parseInt(days) || 30
      options.startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000)
    } else {
      // Default to last 30 days
      options.startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }

    if (end_date) {
      options.endDate = new Date(end_date)
    } else {
      options.endDate = new Date()
    }

    if (service) {
      options.service = service
    }

    if (metric_type) {
      options.metricType = metric_type
    }

    // Validate date range (max 7 days as per acceptance criteria)
    const maxDays = 7
    const diffTime = Math.abs(options.endDate.getTime() - options.startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > maxDays) {
      return toErrorNextResponse({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Date range cannot exceed ${maxDays} days. Please select a smaller range.`,
      })
    }

    // Generate CSV export
    const result = await generateUsageExportCSV(options)

    if (!result.success || !result.csv) {
      return toErrorNextResponse({
        code: ErrorCode.INTERNAL_ERROR,
        message: result.error || 'Failed to generate CSV export',
      })
    }

    // Return CSV file as download
    return new NextResponse(result.csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'X-Record-Count': result.recordCount?.toString() || '0',
      },
    })
  } catch (error: any) {
    console.error('[Usage Export] Error:', error)
    return toErrorNextResponse({
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message || 'Failed to export usage data',
    })
  }
}
