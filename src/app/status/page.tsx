'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
} from 'lucide-react'

interface ServiceStatus {
  service: string
  status: 'operational' | 'degraded' | 'outage'
  last_updated: string
  message: string | null
}

interface Incident {
  id: string
  service: string
  status: string
  title: string
  description: string | null
  impact: string
  started_at: string
  resolved_at: string | null
  affected_services: unknown
  created_at: string
}

interface StatusResponse {
  services: ServiceStatus[]
  incidents: Incident[]
  overall_status: 'operational' | 'degraded' | 'outage'
  last_updated: string
}

const SERVICE_LABELS: Record<string, string> = {
  api_gateway: 'API Gateway',
  auth: 'Auth Service',
  realtime: 'Realtime Service',
  graphql: 'GraphQL Service',
  storage: 'Storage Service',
  control_plane: 'Control Plane',
}

const STATUS_CONFIG = {
  operational: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    label: 'Operational',
  },
  degraded: {
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Degraded',
  },
  outage: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Outage',
  },
}

const IMPACT_LABELS: Record<string, string> = {
  high: 'High Impact',
  medium: 'Medium Impact',
  low: 'Low Impact',
}

export default function StatusPage() {
  const [statusData, setStatusData] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status')
      if (!response.ok) throw new Error('Failed to fetch status')
      const data = await response.json()
      setStatusData(data)
      setError(null)
    } catch (err) {
      setError('Failed to load status information')
      console.error(err)
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }

  useEffect(() => {
    fetchStatus()

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const activeIncidents = statusData?.incidents.filter((i) => i.status === 'active') || []
  const resolvedIncidents = statusData?.incidents.filter((i) => i.status === 'resolved') || []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading status...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              System Status
            </h1>
          </div>
          {statusData && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-sm">
              {statusData.overall_status === 'operational' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
              {statusData.overall_status === 'degraded' && (
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
              {statusData.overall_status === 'outage' && (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {STATUS_CONFIG[statusData.overall_status].label}
              </span>
            </div>
          )}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </motion.div>
        )}

        {statusData && (
          <>
            {/* Services Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Service Status
              </h2>
              <div className="grid gap-4">
                {statusData.services.map((service) => {
                  const config = STATUS_CONFIG[service.status]
                  const Icon = config.icon

                  return (
                    <motion.div
                      key={service.service}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + statusData.services.indexOf(service) * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {SERVICE_LABELS[service.service] || service.service}
                          </h3>
                          {service.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                              {service.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${config.color}`}>
                        {config.label}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Active Incidents */}
            {activeIncidents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Active Incidents
                </h2>
                <div className="space-y-4">
                  {activeIncidents.map((incident) => (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {incident.title}
                          </h3>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                          {IMPACT_LABELS[incident.impact] || incident.impact}
                        </span>
                      </div>
                      {incident.description && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 ml-7">
                          {incident.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3 ml-7 text-xs text-gray-600 dark:text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Started {new Date(incident.started_at).toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Incident History */}
            {resolvedIncidents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Incident History (Last 7 Days)
                </h2>
                <div className="space-y-3">
                  {resolvedIncidents.map((incident) => (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                            {incident.title}
                          </h3>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(incident.resolved_at!).toLocaleString()}
                        </span>
                      </div>
                      {incident.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 ml-6">
                          {incident.description}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-4"
            >
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              <button
                onClick={fetchStatus}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
              <span>Auto-refreshes every 60 seconds</span>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
