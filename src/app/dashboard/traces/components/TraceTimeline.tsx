/**
 * Trace Timeline Component
 * Timeline visualization of request flow
 */

import { Clock, ChevronRight } from 'lucide-react'
import type { RequestTrace } from '../types'
import { formatDuration, getServiceIcon, calculateServiceDurations } from '../utils'
import { SERVICE_COLORS } from '../constants'

interface TraceTimelineProps {
  trace: RequestTrace
}

export function TraceTimeline({ trace }: TraceTimelineProps) {
  const { total_duration_ms, services_hit } = trace

  if (total_duration_ms === null || services_hit.length === 0) {
    return null
  }

  const serviceDurations = calculateServiceDurations(services_hit, total_duration_ms)
  const maxDuration = total_duration_ms

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-slate-600" />
        Request Timeline
      </h3>

      {/* Timeline bar */}
      <div className="relative mb-6">
        <div className="h-12 bg-slate-100 rounded-lg overflow-hidden flex">
          {serviceDurations.map((item, index) => {
            const width = (item.duration / maxDuration) * 100
            const IconComponent = getServiceIcon(item.service)
            const color = SERVICE_COLORS[item.service] || '#64748b'

            return (
              <div
                key={index}
                className="h-full flex items-center justify-center relative group"
                style={{ width: `${width}%`, backgroundColor: color }}
              >
                <IconComponent className="w-4 h-4 text-white" />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {item.service}: {formatDuration(item.duration)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Service breakdown list */}
      <div className="space-y-3">
        {serviceDurations.map((item, index) => {
          const IconComponent = getServiceIcon(item.service)
          const color = SERVICE_COLORS[item.service] || '#64748b'
          const width = (item.duration / maxDuration) * 100

          return (
            <div key={index} className="flex items-center gap-4">
              <IconComponent className="w-5 h-5 flex-shrink-0" style={{ color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900 capitalize">{item.service}</span>
                  <span className="text-sm text-slate-600">{formatDuration(item.duration)}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${width}%`, backgroundColor: color }}
                  />
                </div>
              </div>
              {index < serviceDurations.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Total duration */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Total Duration</span>
          <span className="text-lg font-semibold text-slate-900">
            {formatDuration(total_duration_ms)}
          </span>
        </div>
      </div>
    </div>
  )
}
