/**
 * Results Table CSV Export Utility
 */

import type { QueryResult } from './types'

export function handleExportCSV(result: QueryResult) {
  if (result.rows.length === 0) return

  const headers = result.columns
  const rows = result.rows

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header]
          // Handle values that contain commas or quotes
          if (val == null) return ''
          const strVal = String(val)
          if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
            return `"${strVal.replace(/"/g, '""')}"`
          }
          return strVal
        })
        .join(',')
    ),
  ].join('\n')

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `query-results-${Date.now()}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
