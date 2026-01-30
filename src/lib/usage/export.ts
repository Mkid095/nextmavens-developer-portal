/**
 * Usage Data Export Utility
 *
 * Exports usage data to CSV format for external analysis.
 *
 * US-008 from prd-usage-tracking.json
 */

import { getPool } from '@/lib/db'

export interface UsageExportRecord {
  date: string
  service: string
  metric_type: string
  quantity: number
}

export interface UsageExportOptions {
  projectId: string
  startDate?: Date
  endDate?: Date
  service?: string
  metricType?: string
}

/**
 * Fetch usage data for export
 */
export async function fetchUsageDataForExport(
  options: UsageExportOptions
): Promise<{
  success: boolean
  data?: UsageExportRecord[]
  error?: string
}> {
  const { projectId, startDate, endDate, service, metricType } = options

  const pool = getPool()

  try {
    const whereConditions: string[] = ['project_id = $1']
    const queryParams: any[] = [projectId]
    let paramIndex = 2

    if (startDate) {
      whereConditions.push(`recorded_at >= $${paramIndex++}`)
      queryParams.push(startDate)
    }

    if (endDate) {
      whereConditions.push(`recorded_at <= $${paramIndex++}`)
      queryParams.push(endDate)
    }

    if (service) {
      whereConditions.push(`service = $${paramIndex++}`)
      queryParams.push(service)
    }

    if (metricType) {
      whereConditions.push(`metric_type = $${paramIndex++}`)
      queryParams.push(metricType)
    }

    const query = `
      SELECT
        DATE(recorded_at) as date,
        service,
        metric_type,
        SUM(quantity) as quantity
      FROM control_plane.usage_metrics
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY DATE(recorded_at), service, metric_type
      ORDER BY date DESC, service, metric_type
    `

    const result = await pool.query(query, queryParams)

    const records: UsageExportRecord[] = result.rows.map((row) => ({
      date: row.date,
      service: row.service,
      metric_type: row.metric_type,
      quantity: parseInt(row.quantity) || 0,
    }))

    return {
      success: true,
      data: records,
    }
  } catch (error: any) {
    console.error('[Usage Export] Error fetching usage data:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Convert usage data to CSV format
 */
export function convertToCSV(data: UsageExportRecord[]): string {
  if (!data || data.length === 0) {
    return 'date,service,metric_type,quantity\n'
  }

  // CSV header
  const header = 'date,service,metric_type,quantity'

  // CSV rows
  const rows = data.map((record) => {
    return `${record.date},${record.service},${record.metric_type},${record.quantity}`
  })

  return [header, ...rows].join('\n')
}

/**
 * Generate CSV export for usage data
 */
export async function generateUsageExportCSV(
  options: UsageExportOptions
): Promise<{
  success: boolean
  csv?: string
  filename?: string
  recordCount?: number
  error?: string
}> {
  const result = await fetchUsageDataForExport(options)

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to fetch usage data',
    }
  }

  const csv = convertToCSV(result.data)

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `usage-export-${options.projectId}-${timestamp}.csv`

  return {
    success: true,
    csv,
    filename,
    recordCount: result.data.length,
  }
}
