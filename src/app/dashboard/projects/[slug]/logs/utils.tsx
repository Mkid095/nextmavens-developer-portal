/**
 * Logs Page Utilities
 */

import type { DateRangeFilter } from './types'

export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) => {
    if (regex.test(part)) {
      return <mark key={i} className="bg-yellow-200 text-slate-900 rounded px-0.5">{part}</mark>
    }
    return part
  })
}

export function getDateRange(
  filter: DateRangeFilter,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } {
  const now = new Date()
  let start = new Date()
  if (filter === 'custom' && customStart && customEnd) {
    start = new Date(customStart)
    const end = new Date(customEnd)
    end.setHours(23, 59, 59, 999)
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }
  const ms: Record<string, number> = { '1h': 3600000, '24h': 86400000, '7d': 604800000, '30d': 2592000000 }
  const msValue = filter !== 'custom' ? ms[filter] : 86400000
  start = new Date(now.getTime() - (msValue || 86400000))
  return { startDate: start.toISOString(), endDate: now.toISOString() }
}

export function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString()
}

export function downloadLogs(logs: any[], format: 'json' | 'text', filename: string): void {
  const content = format === 'json' ? JSON.stringify(logs, null, 2) : logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.service}] ${l.message}`).join('\n')
  const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.${format === 'json' ? 'json' : 'txt'}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
