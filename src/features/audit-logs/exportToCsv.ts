import type { AuditLogEntry } from '@/lib/types/audit.types'
import { ACTOR_TYPE_LABELS } from '@/lib/types/audit.types'

export function exportAuditLogsToCSV(logs: AuditLogEntry[]): void {
  if (logs.length === 0) {
    return
  }

  const headers = ['Timestamp', 'Actor', 'Actor Type', 'Action', 'Target Type', 'Target ID', 'IP Address', 'User Agent', 'Metadata']
  const rows = logs.map(log => [
    log.created_at,
    log.actor_id,
    ACTOR_TYPE_LABELS[log.actor_type],
    log.action,
    log.target_type,
    log.target_id,
    log.ip_address || '',
    log.user_agent || '',
    JSON.stringify(log.metadata),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        const cellStr = String(cell)
        // Prevent CSV injection: prepend with single quote if cell starts with dangerous characters
        const sanitized = /^[=+\-@]/.test(cellStr) ? `'${cellStr}` : cellStr
        // Escape quotes and wrap in quotes
        return `"${sanitized.replace(/"/g, '""')}"`
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
