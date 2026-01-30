'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Database,
  HardDrive,
  Activity,
  Shield,
  Code2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

/**
 * US-007: Create Usage Dashboard
 * prd-usage-tracking.json
 *
 * Displays resource consumption metrics with visual indicators,
 * progress bars, color coding, and historical usage charts.
 */

interface UsageResponse {
  project_id: string
  period: {
    start_date: string
    end_date: string
    aggregation: string
  }
  usage: {
    total_by_service: ServiceUsage[]
    total_by_metric: MetricUsage[]
    time_series: TimeSeriesEntry[]
  }
  quota?: QuotaInfo[]
}

interface ServiceUsage {
  service: string
  total_quantity: number
  metric_breakdown: MetricBreakdown[]
}

interface MetricBreakdown {
  metric_type: string
  quantity: number
}

interface MetricUsage {
  metric_type: string
  total_quantity: number
}

interface TimeSeriesEntry {
  period: string
  service: string
  metric_type: string
  quantity: number
}

interface QuotaInfo {
  service: string
  current_usage: number
  monthly_limit: number
  hard_cap: number
  usage_percentage: number
  reset_at: string
}

interface Project {
  id: string
  name: string
  slug: string
}

const SERVICE_CONFIG: Record<string, { label: string; icon: any; color: string; unit: string }> = {
  database: { label: 'Database', icon: Database, color: 'blue', unit: 'queries' },
  realtime: { label: 'Realtime', icon: Activity, color: 'green', unit: 'messages' },
  storage: { label: 'Storage', icon: HardDrive, color: 'purple', unit: 'bytes' },
  auth: { label: 'Auth', icon: Shield, color: 'orange', unit: 'operations' },
  functions: { label: 'Functions', icon: Code2, color: 'red', unit: 'invocations' },
}

const METRIC_LABELS: Record<string, string> = {
  db_query: 'Queries',
  db_row_read: 'Rows Read',
  db_row_written: 'Rows Written',
  realtime_message: 'Messages',
  realtime_connection: 'Connections',
  storage_upload: 'Uploads',
  storage_download: 'Downloads',
  storage_bytes: 'Bytes',
  auth_signup: 'Signups',
  auth_signin: 'Signins',
  function_invocation: 'Invocations',
}

export default function UsageDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [usageData, setUsageData] = useState<UsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [aggregation, setAggregation] = useState<'day' | 'week' | 'month'>('day')
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchProject()
    fetchUsageData()
  }, [params.slug, aggregation, days])

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`/api/projects/by-slug?slug=${params.slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        throw new Error('Failed to load project')
      }
      const data = await res.json()
      setProject(data.project)
    } catch (err) {
      console.error('Failed to fetch project:', err)
      setError('Failed to load project')
    }
  }

  const fetchUsageData = async () => {
    if (!params.slug) return

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(
        `/api/usage/${params.slug}?aggregation=${aggregation}&days=${days}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!res.ok) {
        throw new Error('Failed to load usage data')
      }

      const data: UsageResponse = await res.json()
      setUsageData(data)
    } catch (err) {
      console.error('Failed to fetch usage data:', err)
      setError('Failed to load usage data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUsageData()
    setRefreshing(false)
  }

  const handleExportCSV = () => {
    if (!usageData) return

    const rows = [
      ['Date', 'Service', 'Metric Type', 'Quantity'],
      ...usageData.usage.time_series.map((entry) => [
        entry.period,
        entry.service,
        entry.metric_type,
        entry.quantity.toString(),
      ]),
    ]

    const csv = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usage-${params.slug}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'red'
    if (percentage >= 70) return 'yellow'
    return 'green'
  }

  const getServiceIcon = (service: string) => {
    return SERVICE_CONFIG[service]?.icon || Activity
  }

  const getServiceColor = (service: string): string => {
    return SERVICE_CONFIG[service]?.color || 'gray'
  }

  if (loading && !usageData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error && !usageData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchUsageData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/dashboard/projects/${params.slug}`}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Usage Dashboard
                </h1>
                {project && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {project.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Aggregation Selector */}
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>

              {/* Days Selector */}
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                disabled={!usageData}
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Period Info */}
          {usageData && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(usageData.period.start_date).toLocaleDateString()} -{' '}
                {new Date(usageData.period.end_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {usageData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Quota Overview Cards */}
            {usageData.quota && usageData.quota.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {usageData.quota.map((quota) => {
                  const Icon = getServiceIcon(quota.service)
                  const color = getServiceColor(quota.service)
                  const usageColor = getUsageColor(quota.usage_percentage)

                  return (
                    <div
                      key={quota.service}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 bg-${color}-100 dark:bg-${color}-900 rounded-lg`}>
                            <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {SERVICE_CONFIG[quota.service]?.label || quota.service}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Resets {new Date(quota.reset_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className={`flex items-center space-x-1 text-${usageColor}-600 dark:text-${usageColor}-400`}>
                          {quota.usage_percentage >= 70 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium">
                            {quota.usage_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {quota.current_usage.toLocaleString()} / {quota.monthly_limit.toLocaleString()}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {quota.hard_cap.toLocaleString()} cap
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full bg-${usageColor}-500 transition-all duration-500`}
                            style={{ width: `${Math.min(quota.usage_percentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Status Indicator */}
                      {quota.usage_percentage >= 90 ? (
                        <div className="mt-4 flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>Approaching limit</span>
                        </div>
                      ) : quota.usage_percentage >= 70 ? (
                        <div className="mt-4 flex items-center space-x-2 text-sm text-yellow-600 dark:text-yellow-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>Usage elevated</span>
                        </div>
                      ) : (
                        <div className="mt-4 flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>Within limits</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Usage by Service */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Usage by Service
                </h2>
              </div>
              <div className="p-6">
                {usageData.usage.total_by_service.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No usage data available for this period
                  </p>
                ) : (
                  <div className="space-y-6">
                    {usageData.usage.total_by_service.map((serviceUsage) => {
                      const Icon = getServiceIcon(serviceUsage.service)
                      const color = getServiceColor(serviceUsage.service)

                      return (
                        <div key={serviceUsage.service} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {SERVICE_CONFIG[serviceUsage.service]?.label || serviceUsage.service}
                              </span>
                            </div>
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatNumber(serviceUsage.total_quantity)}
                            </span>
                          </div>

                          {/* Metric Breakdown */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-8">
                            {serviceUsage.metric_breakdown.map((metric) => (
                              <div
                                key={metric.metric_type}
                                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                              >
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {METRIC_LABELS[metric.metric_type] || metric.metric_type}
                                </p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                                  {metric.metric_type === 'storage_bytes'
                                    ? formatBytes(metric.quantity)
                                    : formatNumber(metric.quantity)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Historical Usage Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Historical Usage
                </h2>
              </div>
              <div className="p-6">
                {usageData.usage.time_series.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No time series data available for this period
                  </p>
                ) : (
                  <div className="space-y-4">
                    {usageData.usage.time_series
                      .reduce((acc: any[], entry) => {
                        const existing = acc.find((e) => e.period === entry.period)
                        if (existing) {
                          existing.total += entry.quantity
                        } else {
                          acc.push({ period: entry.period, total: entry.quantity })
                        }
                        return acc
                      }, [])
                      .sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime())
                      .slice(0, 14)
                      .reverse()
                      .map((entry: any) => {
                        const maxValue = Math.max(
                          ...usageData.usage.time_series.map((e) => e.quantity)
                        )
                        const percentage = (entry.total / maxValue) * 100

                        return (
                          <div key={entry.period} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                {new Date(entry.period).toLocaleDateString()}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatNumber(entry.total)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
