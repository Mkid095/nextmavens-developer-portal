/**
 * Abuse Dashboard - Cap Violations List Component
 */

import { Shield } from 'lucide-react'
import { formatCapType } from '../utils'
import type { DashboardData } from '../types'

interface CapViolationsListProps {
  violations: DashboardData['cap_violations']['violations']
}

export function CapViolationsList({ violations }: CapViolationsListProps) {
  if (violations.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No cap violations in this time range</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {violations.slice(0, 5).map((violation) => (
        <div key={violation.project_id} className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-medium text-slate-900">{violation.project_name}</div>
              <div className="text-sm text-slate-600">{violation.organization}</div>
            </div>
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
              {formatCapType(violation.cap_exceeded)}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {new Date(violation.suspended_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}
