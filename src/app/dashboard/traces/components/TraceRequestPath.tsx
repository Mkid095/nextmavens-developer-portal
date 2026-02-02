/**
 * Trace Request Path Component
 * Visual representation of request path through services
 */

import { GitBranch, ChevronRight } from 'lucide-react'
import type { RequestTrace } from '../types'
import { getServiceIcon } from '../utils'
import { SERVICE_COLORS } from '../constants'

interface TraceRequestPathProps {
  trace: RequestTrace
}

export function TraceRequestPath({ trace }: TraceRequestPathProps) {
  const { services_hit } = trace

  if (services_hit.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-slate-600" />
          Request Path
        </h3>
        <p className="text-slate-500 text-sm">No services were hit during this request.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-slate-600" />
        Request Path Through Services
      </h3>

      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        {services_hit.map((service, index) => {
          const IconComponent = getServiceIcon(service)
          const color = SERVICE_COLORS[service] || '#64748b'

          return (
            <div key={index} className="flex items-center">
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 whitespace-nowrap"
                style={{ borderColor: color, backgroundColor: `${color}10` }}
              >
                <IconComponent className="w-5 h-5" style={{ color }} />
                <span className="font-medium text-sm text-slate-900 capitalize">{service}</span>
              </div>
              {index < services_hit.length - 1 && (
                <ChevronRight className="w-5 h-5 text-slate-400 mx-1" />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-600">
          This request passed through{' '}
          <span className="font-semibold text-slate-900">{services_hit.length}</span> service(s).
        </p>
      </div>
    </div>
  )
}
