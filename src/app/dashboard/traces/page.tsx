'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Search,
  ArrowLeft,
  Clock,
  ChevronRight,
  AlertCircle,
  Loader2,
  ExternalLink,
  Calendar,
  Activity,
  Zap,
  Database,
  Shield,
  Code2,
  Radio,
  HardDrive,
  GitBranch,
  Webhook,
} from 'lucide-react'

/**
 * Service icon mapping for visual representation
 */
const SERVICE_ICONS: Record<string, React.ElementType> = {
  gateway: Zap,
  'developer-portal': Activity,
  'control-plane-api': Code2,
  database: Database,
  auth: Shield,
  graphql: GitBranch,
  realtime: Radio,
  storage: HardDrive,
  functions: Code2,
  webhooks: Webhook,
}

/**
 * Service color mapping for timeline visualization
 */
const SERVICE_COLORS: Record<string, string> = {
  gateway: '#8b5cf6', // violet
  'developer-portal': '#10b981', // emerald
  'control-plane-api': '#f59e0b', // amber
  database: '#3b82f6', // blue
  auth: '#ef4444', // red
  graphql: '#ec4899', // pink
  realtime: '#14b8a6', // teal
  storage: '#f97316', // orange
  functions: '#6366f1', // indigo
  webhooks: '#a855f7', // purple
}

/**
 * Request Trace interface from API
 */
interface RequestTrace {
  request_id: string
  project_id: string
  path: string
  method: string
  services_hit: string[]
  total_duration_ms: number | null
  created_at: string
}

/**
 * Trace Detail Response from API
 */
interface TraceDetail {
  success: boolean
  data?: RequestTrace
  error?: {
    code: string
    message: string
  }
}

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
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trace, setTrace] = useState<RequestTrace | null>(null)
  const [recentTraces, setRecentTraces] = useState<RequestTrace[]>([])
  const [showRecent, setShowRecent] = useState(false)

  // Handle search by request_id
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)
    setTrace(null)
    setShowRecent(false)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/v1/traces/${searchQuery.trim()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        router.push('/login')
        return
      }

      const data: TraceDetail = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error?.message || 'Failed to fetch trace')
        return
      }

      if (data.data) {
        setTrace(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch trace:', err)
      setError('Failed to fetch trace. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch recent traces for the current project (if available)
  const fetchRecentTraces = async () => {
    // This would require knowing the current project
    // For now, we'll skip this or use a different approach
    setShowRecent(true)
  }

  // Format duration for display
  const formatDuration = (ms: number | null): string => {
    if (ms === null) return 'N/A'
    if (ms < 1) return '< 1ms'
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  // Get service icon component
  const getServiceIcon = (serviceName: string): React.ElementType => {
    return SERVICE_ICONS[serviceName] || Activity
  }

  // Calculate service duration (estimated)
  // Since we only have total duration, we estimate per service
  const calculateServiceDurations = (services: string[], totalDuration: number | null) => {
    if (totalDuration === null || services.length === 0) return []

    // Estimate: divide total duration evenly across services
    // In a real implementation, each service would log its own duration
    const perServiceDuration = totalDuration / services.length

    let accumulatedTime = 0
    return services.map((service, index) => {
      const duration = index === services.length - 1
        ? totalDuration - accumulatedTime
        : perServiceDuration

      accumulatedTime += duration

      return {
        service,
        duration: Math.round(duration),
        startTime: Math.round(accumulatedTime - duration),
        endTime: Math.round(accumulatedTime),
      }
    })
  }

  // Timeline visualization component
  const TimelineVisualization = ({
    services,
    totalDuration,
  }: {
    services: string[]
    totalDuration: number | null
  }) => {
    if (totalDuration === null || services.length === 0) {
      return null
    }

    const serviceDurations = calculateServiceDurations(services, totalDuration)
    const maxDuration = totalDuration

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
            <span className="text-lg font-semibold text-slate-900">{formatDuration(totalDuration)}</span>
          </div>
        </div>
      </div>
    )
  }

  // Request path visualization component
  const RequestPath = ({ services }: { services: string[] }) => {
    if (services.length === 0) {
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
          {services.map((service, index) => {
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
                {index < services.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-slate-400 mx-1" />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600">
            This request passed through <span className="font-semibold text-slate-900">{services.length}</span> service(s).
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Request Traces</h1>
                <p className="text-xs text-slate-500">Debug request flow across services</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Search Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Search by Request ID</h2>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter request ID (UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-mono text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search
                  </>
                )}
              </button>
            </form>

            {/* Info text about finding request IDs */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How to find Request IDs</p>
                  <p className="text-blue-700">
                    Request IDs (correlation IDs) are returned in the <code className="px-1 py-0.5 bg-blue-100 rounded text-xs">x-request-id</code> response header
                    for all API requests. You can also find them in log entries and audit logs.
                  </p>
                </div>
              </div>
            </div>
          </div>

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
              {/* Trace Header */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Request Details</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(trace.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      trace.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                      trace.method === 'POST' ? 'bg-green-100 text-green-700' :
                      trace.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                      trace.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {trace.method}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Request ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm text-slate-900 bg-slate-100 px-3 py-2 rounded font-mono break-all">
                        {trace.request_id}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(trace.request_id)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition"
                        title="Copy to clipboard"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Project ID</label>
                    <div className="mt-1">
                      <code className="text-sm text-slate-900 bg-slate-100 px-3 py-2 rounded font-mono">
                        {trace.project_id}
                      </code>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Request Path</label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="text-sm text-slate-900 bg-slate-100 px-3 py-2 rounded font-mono break-all flex-1">
                        {trace.path}
                      </code>
                      <Link
                        href={trace.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Hit Summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-600" />
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

              {/* Request Path Visualization */}
              <RequestPath services={trace.services_hit} />

              {/* Timeline Visualization */}
              <TimelineVisualization services={trace.services_hit} totalDuration={trace.total_duration_ms} />

              {/* Summary Stats */}
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
                      <p className="text-2xl font-semibold text-slate-900">{formatDuration(trace.total_duration_ms)}</p>
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
            </motion.div>
          )}

          {/* Empty state */}
          {!trace && !error && !loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Search for a Request Trace</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Enter a request ID above to view the complete trace of a request as it flows through the platform services.
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
