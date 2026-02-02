/**
 * Trace Stats Component
 * Summary statistics for a trace
 */

import { Activity, Clock, GitBranch } from 'lucide-react'
import type { RequestTrace } from '../types'
import { formatDuration } from '../utils'

interface TraceStatsProps {
  trace: RequestTrace
}

export function TraceStats({ trace }: TraceStatsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Activity className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Services</p>
            <p className="text-2xl font-semibold text-slate-900">{trace.services_hit.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-lg">
            <Clock className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Duration</p>
            <p className="text-2xl font-semibold text-slate-900">
              {formatDuration(trace.total_duration_ms)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 rounded-lg">
            <GitBranch className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Method</p>
            <p className="text-2xl font-semibold text-slate-900">{trace.method}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
