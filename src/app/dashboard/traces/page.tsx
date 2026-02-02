'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Search } from 'lucide-react'
import { useTraceSearch } from './hooks/useTraceSearch'
import {
  TraceNavigation,
  TraceSearch,
  TraceDetails,
  TraceTimeline,
  TraceRequestPath,
  TraceStats,
} from './components'
import { getServiceIcon } from './utils'
import { SERVICE_COLORS } from './constants'

/**
 * Trace viewer page
 *
 * US-012: Create Trace Viewer UI
 *
 * Allows developers to view request traces, search by request_id,
 * see request path through services, duration per service, total duration,
 * and timeline visualization.
 */
export default function TracesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const { loading, error, trace, searchTrace } = useTraceSearch()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await searchTrace(searchQuery)
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <TraceNavigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <TraceSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            loading={loading}
          />

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Trace Details */}
          {trace && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <TraceDetails trace={trace} />

              {/* Services Hit Summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  Services Hit
                </h3>
                {trace.services_hit.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {trace.services_hit.map((service, index) => {
                      const IconComponent = getServiceIcon(service)
                      const color = SERVICE_COLORS[service] || '#64748b'

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                          style={{ borderColor: color, backgroundColor: `${color}10` }}
                        >
                          <IconComponent className="w-4 h-4" style={{ color }} />
                          <span className="text-sm font-medium text-slate-900 capitalize">{service}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No services were hit during this request.</p>
                )}
              </div>

              <TraceRequestPath trace={trace} />
              <TraceTimeline trace={trace} />
              <TraceStats trace={trace} />
            </motion.div>
          )}

          {/* Empty state */}
          {!trace && !error && !loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Search for a Request Trace</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Enter a request ID above to view the complete trace of a request as it flows through
                the platform services.
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
