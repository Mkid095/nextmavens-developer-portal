/**
 * Usage Dashboard Utilities
 * Helper functions for formatting and data manipulation
 */

import { SERVICE_CONFIG, USAGE_COLOR_THRESHOLDS } from '../constants'
import type { TimeSeriesEntry } from '../types'

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Get usage color based on percentage
 */
export function getUsageColor(percentage: number): string {
  if (percentage >= USAGE_COLOR_THRESHOLDS.critical) return 'red'
  if (percentage >= USAGE_COLOR_THRESHOLDS.warning) return 'yellow'
  return 'green'
}

/**
 * Get service icon component
 */
export function getServiceIcon(service: string) {
  return SERVICE_CONFIG[service]?.icon || SERVICE_CONFIG.database.icon
}

/**
 * Get service color
 */
export function getServiceColor(service: string): string {
  return SERVICE_CONFIG[service]?.color || 'gray'
}

/**
 * Aggregate time series data by period
 */
export function aggregateTimeSeries(timeSeries: TimeSeriesEntry[]) {
  return timeSeries
    .reduce((acc: Array<{ period: string; total: number }>, entry) => {
      const existing = acc.find((e) => e.period === entry.period)
      if (existing) {
        existing.total += entry.quantity
      } else {
        acc.push({ period: entry.period, total: entry.quantity })
      }
      return acc
    }, [])
    .sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime())
}

/**
 * Export usage data as CSV
 */
export function exportUsageAsCSV(
  timeSeries: TimeSeriesEntry[],
  projectSlug: string
): void {
  const rows = [
    ['Date', 'Service', 'Metric Type', 'Quantity'],
    ...timeSeries.map((entry) => [
      entry.period,
      entry.service,
      entry.metric_type,
      entry.quantity.toString(),
    ]),
  ]

  const csv = rows.map((row) => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `usage-${projectSlug}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
