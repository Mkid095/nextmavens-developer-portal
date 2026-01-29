'use client'

import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Calendar, Shield, FileText } from 'lucide-react'
import type { AuditLogEntry } from '@/lib/types/audit.types'
import { ACTOR_TYPE_LABELS } from '@/lib/types/audit.types'

/**
 * Sanitize metadata for safe display
 * Removes potential XSS vectors while preserving structure
 */
function sanitizeMetadata(metadata: Record<string, unknown>): string {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(metadata)) {
    // Sanitize key: remove HTML tags and limit length
    const sanitizedKey = key.replace(/[<>]/g, '').substring(0, 100)

    // Sanitize value based on type
    if (typeof value === 'string') {
      // Remove HTML tags and dangerous characters
      sanitized[sanitizedKey] = value.replace(/[<>]/g, '').substring(0, 1000)
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[sanitizedKey] = value
    } else if (Array.isArray(value)) {
      // Sanitize array elements
      sanitized[sanitizedKey] = value.map(v =>
        typeof v === 'string' ? v.replace(/[<>]/g, '').substring(0, 500) : v
      ).slice(0, 50) // Limit array size
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[sanitizedKey] = JSON.parse(sanitizeMetadata(value as Record<string, unknown>))
    }
  }

  return JSON.stringify(sanitized, null, 2)
}

/**
 * Sanitize user agent string for safe display
 * Removes potentially dangerous characters while preserving readability
 */
function sanitizeUserAgent(userAgent: string): string {
  return userAgent
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 500) // Limit length
}

interface AuditLogTableProps {
  logs: AuditLogEntry[]
  expandedRows: Set<string>
  onToggleRow: (id: string) => void
}

export function AuditLogTable({ logs, expandedRows, onToggleRow }: AuditLogTableProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes('created')) return 'bg-emerald-100 text-emerald-800'
    if (action.includes('deleted')) return 'bg-red-100 text-red-800'
    if (action.includes('updated') || action.includes('rotated')) return 'bg-amber-100 text-amber-800'
    if (action.includes('suspended')) return 'bg-orange-100 text-orange-800'
    if (action.includes('accessed')) return 'bg-blue-100 text-blue-800'
    return 'bg-slate-100 text-slate-800'
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-1">No audit logs found</p>
          <p className="text-sm text-slate-400">
            Try adjusting your filters or perform some actions to generate audit logs
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="font-semibold text-slate-900">Audit Log Entries</h2>
      </div>

      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
        <div className="col-span-2">Timestamp</div>
        <div className="col-span-2">Action</div>
        <div className="col-span-2">Target</div>
        <div className="col-span-2">Actor</div>
        <div className="col-span-3">Details</div>
        <div className="col-span-1"></div>
      </div>

      <div className="divide-y divide-slate-100">
        {logs.map((log) => (
          <div key={log.id} className="hover:bg-slate-50">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-900">{formatTimestamp(log.created_at)}</span>
                </div>
              </div>

              <div className="col-span-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getActionBadgeColor(log.action)}`}>
                  {log.action}
                </span>
              </div>

              <div className="col-span-2">
                <div className="text-sm">
                  <div className="font-medium text-slate-900">{log.target_type}</div>
                  <div className="text-xs text-slate-500 truncate" title={log.target_id}>
                    {log.target_id}
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="text-xs text-slate-500">{ACTOR_TYPE_LABELS[log.actor_type]}</div>
                    <div className="font-medium text-slate-900 truncate" title={log.actor_id}>
                      {log.actor_id}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-3">
                {log.ip_address && (
                  <div className="text-xs text-slate-500">IP: {log.ip_address}</div>
                )}
                {Object.keys(log.metadata).length > 0 && (
                  <div className="text-xs text-slate-500">
                    {Object.keys(log.metadata).length} metadata field{Object.keys(log.metadata).length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => onToggleRow(log.id)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  {expandedRows.has(log.id) ? (
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedRows.has(log.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-slate-100"
                >
                  <div className="px-6 py-4 bg-slate-50">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Details</h4>

                    {log.request_id && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-slate-700">Request ID:</span>
                        <p className="text-xs text-slate-600 mt-1 break-all font-mono">{log.request_id}</p>
                      </div>
                    )}

                    {log.ip_address && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-slate-700">IP Address:</span>
                        <p className="text-xs text-slate-600 mt-1">{log.ip_address}</p>
                      </div>
                    )}

                    {Object.keys(log.metadata).length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-slate-900 mb-2">Metadata</h4>
                        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-xs text-emerald-400">
                            {sanitizeMetadata(log.metadata)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {log.user_agent && (
                      <div>
                        <span className="text-xs font-medium text-slate-700">User Agent:</span>
                        <p className="text-xs text-slate-600 mt-1 break-all">{sanitizeUserAgent(log.user_agent)}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
