'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LogOut,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Eye,
  TrendingUp,
  Calendar,
  Loader2,
  RefreshCw,
  Filter,
} from 'lucide-react'

interface DashboardData {
  time_range: string
  start_time: string
  end_time: string
  suspensions: {
    total: number
    active: number
    by_type: Record<string, number>
  }
  rate_limits: {
    total: number
    by_type: Record<string, number>
  }
  cap_violations: {
    total: number
    violations: Array<{
      project_id: string
      project_name: string
      organization: string
      cap_exceeded: string
      reason: string
      suspended_at: string
    }>
  }
  approaching_caps: {
    total: number
    projects: Array<{
      project_id: string
      project_name: string
      organization: string
      cap_type: string
      cap_value: number
      current_usage: number
      usage_percentage: number
    }>
  }
  suspicious_patterns: {
    total: number
    by_type: Record<string, number>
    by_severity: Record<string, number>
    recent: Array<{
      project_id: string
      project_name: string
      organization: string
      pattern_type: string
      severity: string
      occurrence_count: number
      description: string
      detected_at: string
    }>
  }
}

type TimeRange = '24h' | '7d' | '30d'

export default function AbuseDashboardPage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    fetchDashboardData()
  }, [router, timeRange])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(
        `/api/admin/abuse/dashboard?timeRange=${timeRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.clear()
          router.push('/login')
        }
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch dashboard data')
      }

      const result = await res.json()
      setDashboardData(result.data)
      setError('')
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  const formatCapType = (capType: string): string => {
    return capType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatPatternType = (patternType: string): string => {
    return patternType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'warning':
        return 'text-amber-600 bg-amber-100'
      case 'critical':
        return 'text-orange-600 bg-orange-100'
      case 'severe':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-slate-600 bg-slate-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
          <span className="text-slate-600">Loading dashboard...</span>
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

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1400px] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
                </svg>
              </div>
              <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">
                nextmavens
              </span>
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1400px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert className="w-8 h-8 text-emerald-700" />
                <h1 className="text-3xl font-semibold text-slate-900">
                  Abuse Dashboard
                </h1>
              </div>
              <p className="text-slate-600">
                Monitor platform abuse, suspensions, and security patterns
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                      timeRange === range
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Error loading dashboard</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {dashboardData && (
            <>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Shield className="w-5 h-5 text-red-700" />
                    </div>
                    <span className="font-medium text-slate-900">Suspensions</span>
                  </div>
                  <div className="text-3xl font-semibold text-slate-900 mb-1">
                    {dashboardData.suspensions.total}
                  </div>
                  <div className="text-sm text-slate-600">
                    {dashboardData.suspensions.active} active
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Activity className="w-5 h-5 text-orange-700" />
                    </div>
                    <span className="font-medium text-slate-900">Rate Limits</span>
                  </div>
                  <div className="text-3xl font-semibold text-slate-900 mb-1">
                    {dashboardData.rate_limits.total}
                  </div>
                  <div className="text-sm text-slate-600">
                    Total hits
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-700" />
                    </div>
                    <span className="font-medium text-slate-900">Cap Violations</span>
                  </div>
                  <div className="text-3xl font-semibold text-slate-900 mb-1">
                    {dashboardData.cap_violations.total}
                  </div>
                  <div className="text-sm text-slate-600">
                    Projects exceeded limits
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Eye className="w-5 h-5 text-purple-700" />
                    </div>
                    <span className="font-medium text-slate-900">Suspicious Patterns</span>
                  </div>
                  <div className="text-3xl font-semibold text-slate-900 mb-1">
                    {dashboardData.suspicious_patterns.total}
                  </div>
                  <div className="text-sm text-slate-600">
                    Pattern detections
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Recent Cap Violations
                    </h2>
                  </div>
                  <div className="p-6">
                    {dashboardData.cap_violations.violations.length === 0 ? (
                      <div className="text-center py-8">
                        <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No cap violations in this time range</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dashboardData.cap_violations.violations.slice(0, 5).map((violation) => (
                          <div
                            key={violation.project_id}
                            className="p-4 bg-slate-50 rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-medium text-slate-900">
                                  {violation.project_name}
                                </div>
                                <div className="text-sm text-slate-600">
                                  {violation.organization}
                                </div>
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
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Recent Suspicious Patterns
                    </h2>
                  </div>
                  <div className="p-6">
                    {dashboardData.suspicious_patterns.recent.length === 0 ? (
                      <div className="text-center py-8">
                        <Eye className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No suspicious patterns detected</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dashboardData.suspicious_patterns.recent.slice(0, 5).map((pattern, index) => (
                          <div
                            key={`${pattern.project_id}-${index}`}
                            className="p-4 bg-slate-50 rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-slate-900 mb-1">
                                  {pattern.project_name}
                                </div>
                                <div className="text-sm text-slate-600 mb-2">
                                  {pattern.description}
                                </div>
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
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Suspensions by Type
                  </h2>
                </div>
                <div className="p-6">
                  {Object.keys(dashboardData.suspensions.by_type).length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No suspensions in this time range</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-4 gap-4">
                      {Object.entries(dashboardData.suspensions.by_type).map(([capType, count]) => (
                        <div
                          key={capType}
                          className="p-4 bg-slate-50 rounded-lg text-center"
                        >
                          <div className="text-2xl font-semibold text-slate-900 mb-1">
                            {count}
                          </div>
                          <div className="text-sm text-slate-600">
                            {formatCapType(capType)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  )
}
