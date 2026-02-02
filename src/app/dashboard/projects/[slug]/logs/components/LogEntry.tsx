/**
 * LogEntry Component
 *
 * Individual log entry row component with expandable details.
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { LogEntry as LogEntryType } from '../types'
import { LEVEL_ICONS, LOG_LEVEL_COLORS } from '../constants'
import { highlightText, formatTimestamp } from '../utils'

// Map icon names to Lucide icons
import { AlertCircle, AlertTriangle, Info as InfoIcon } from 'lucide-react'

const LEVEL_ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle: InfoIcon,
  AlertTriangle: AlertTriangle,
  AlertCircle: AlertCircle,
  info: InfoIcon,
  warn: AlertTriangle,
  error: AlertCircle,
}

interface LogEntryProps {
  log: LogEntryType
  isExpanded: boolean
  onToggle: () => void
  searchQuery: string
}

export function LogEntry({ log, isExpanded, onToggle, searchQuery }: LogEntryProps) {
  const getLevelIcon = (level: string) => {
    const iconKey = LEVEL_ICONS[level] || 'info'
    const IconComponent = LEVEL_ICON_COMPONENTS[iconKey] || LEVEL_ICON_COMPONENTS.info
    return <IconComponent className="w-4 h-4" />
  }

  const getLevelBgColor = (level: string) => {
    const colors = LOG_LEVEL_COLORS[level] || LOG_LEVEL_COLORS.info
    return colors.split(' ').find((c) => c.startsWith('bg-')) || 'bg-gray-50'
  }

  const getLevelTextColor = (level: string) => {
    const colors = LOG_LEVEL_COLORS[level] || LOG_LEVEL_COLORS.info
    return colors.split(' ').find((c) => c.startsWith('text-')) || 'text-slate-600'
  }

  const getBorderColor = (level: string) => {
    const colors = LOG_LEVEL_COLORS[level] || LOG_LEVEL_COLORS.info
    return colors.split(' ').find((c) => c.startsWith('border-')) || 'border-gray-200'
  }

  const borderColor = getBorderColor(log.level)
  const bgColor = getLevelBgColor(log.level)
  const textColor = getLevelTextColor(log.level)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-4 border-l-4 ${bgColor} ${borderColor} cursor-pointer hover:shadow-sm transition`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        {/* Level Icon */}
        <div className={`mt-0.5 ${textColor}`}>{getLevelIcon(log.level)}</div>

        {/* Log Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 bg-white rounded border border-slate-200 uppercase">
              {log.service}
            </span>
            <span className={`text-xs font-semibold uppercase ${textColor}`}>{log.level}</span>
            <span className="text-xs text-slate-500">{formatTimestamp(log.timestamp)}</span>
          </div>
          <p className="text-sm text-slate-800 break-words">{highlightText(log.message, searchQuery)}</p>

          {/* Expanded Details */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-white rounded-lg border border-slate-200 text-sm"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-slate-700">Request ID:</span>
                  <code className="ml-2 text-xs text-slate-600">{log.request_id || 'N/A'}</code>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Timestamp:</span>
                  <span className="ml-2 text-xs text-slate-600">{log.timestamp}</span>
                </div>
              </div>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="mt-4">
                  <span className="font-medium text-slate-700">Metadata:</span>
                  <pre className="mt-2 p-3 bg-slate-900 rounded-lg overflow-x-auto">
                    <code className="text-xs text-emerald-400">
                      {searchQuery
                        ? highlightText(JSON.stringify(log.metadata, null, 2), searchQuery)
                        : JSON.stringify(log.metadata, null, 2)}
                    </code>
                  </pre>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Expand Icon */}
        <div className="text-slate-400">
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
