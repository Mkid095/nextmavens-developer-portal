/**
 * Abuse Dashboard - Header Component
 */

import { ShieldAlert, RefreshCw } from 'lucide-react'
import { TIME_RANGE_LABELS } from '../constants'
import type { TimeRange } from '../types'

interface HeaderProps {
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  onRefresh: () => void
  refreshing: boolean
}

export function Header({ timeRange, onTimeRangeChange, onRefresh, refreshing }: HeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-8 h-8 text-emerald-700" />
            <h1 className="text-3xl font-semibold text-slate-900">Abuse Dashboard</h1>
          </div>
          <p className="text-slate-600">Monitor platform abuse, suspensions, and security patterns</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
            {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  timeRange === range
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {TIME_RANGE_LABELS[range]}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </>
  )
}
