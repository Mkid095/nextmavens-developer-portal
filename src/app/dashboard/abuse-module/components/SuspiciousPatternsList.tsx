/**
 * Abuse Dashboard - Suspicious Patterns List Component
 */

import { Eye } from 'lucide-react'
import { formatPatternType, getSeverityColor } from '../utils'
import type { DashboardData } from '../types'

interface SuspiciousPatternsListProps {
  patterns: DashboardData['suspicious_patterns']['recent']
}

export function SuspiciousPatternsList({ patterns }: SuspiciousPatternsListProps) {
  if (patterns.length === 0) {
    return (
      <div className="text-center py-8">
        <Eye className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No suspicious patterns detected</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {patterns.slice(0, 5).map((pattern, index) => (
        <div key={`${pattern.project_id}-${index}`} className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="font-medium text-slate-900 mb-1">{pattern.project_name}</div>
              <div className="text-sm text-slate-600 mb-2">{pattern.description}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded-full font-medium">
                  {formatPatternType(pattern.pattern_type)}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(pattern.severity)}`}>
                  {pattern.severity}
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 ml-3">
              {new Date(pattern.detected_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
