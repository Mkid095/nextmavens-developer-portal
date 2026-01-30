'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  FileText,
  Search,
  Filter,
  Download,
  ChevronDown,
  AlertCircle,
  Loader2,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
} from 'lucide-react'

interface Project {
  id: string
  name: string
  slug: string
  tenant_id: string
  created_at: string
}

interface LogEntry {
  id: string
  timestamp: string
  service: string
  level: 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, any>
  request_id?: string
}

type ServiceFilter = 'all' | 'db' | 'auth' | 'realtime' | 'storage' | 'graphql'
type LevelFilter = 'all' | 'info' | 'warn' | 'error'

const serviceOptions: { value: ServiceFilter; label: string }[] = [
  { value: 'all', label: 'All Services' },
  { value: 'db', label: 'Database' },
  { value: 'auth', label: 'Auth' },
  { value: 'realtime', label: 'Realtime' },
  { value: 'storage', label: 'Storage' },
  { value: 'graphql', label: 'GraphQL' },
]

const levelOptions: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warning' },
  { value: 'error', label: 'Error' },
]

// Quick date range options
const dateRangeOptions: { value: string; label: string; hours?: number }[] = [
  { value: '1h', label: 'Last 1 hour', hours: 1 },
  { value: '24h', label: 'Last 24 hours', hours: 24 },
  { value: '7d', label: 'Last 7 days', hours: 24 * 7 },
  { value: '30d', label: 'Last 30 days', hours: 24 * 30 },
  { value: 'custom', label: 'Custom range' },
]

// Mock log data for demonstration - will be replaced with real-time streaming
const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    service: 'db',
    level: 'info',
    message: 'Query executed successfully',
    metadata: { query: 'SELECT * FROM users LIMIT 10', duration: '45ms' },
    request_id: 'req_abc123',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    service: 'auth',
    level: 'info',
    message: 'User authenticated successfully',
    metadata: { user_id: 'user_123', method: 'jwt' },
    request_id: 'req_def456',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    service: 'db',
    level: 'warn',
    message: 'Slow query detected',
    metadata: { query: 'SELECT * FROM orders', duration: '2500ms' },
    request_id: 'req_ghi789',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    service: 'storage',
    level: 'error',
    message: 'Failed to upload file',
    metadata: { file: 'avatar.png', error: 'File size exceeds limit' },
    request_id: 'req_jkl012',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    service: 'graphql',
    level: 'info',
    message: 'GraphQL query executed',
    metadata: { operation: 'GetUserProfile', complexity: 5 },
    request_id: 'req_mno345',
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
    service: 'realtime',
    level: 'info',
    message: 'WebSocket connection established',
    metadata: { client_id: 'client_xyz', channel: 'notifications' },
    request_id: 'req_pqr678',
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 1000 * 15).toISOString(),
    service: 'auth',
    level: 'error',
    message: 'Authentication failed',
    metadata: { reason: 'Invalid token', ip: '192.168.1.1' },
    request_id: 'req_stu901',
  },
]

export default function LogsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventSourceRef = useRef<EventSource | null>(null)

  const [project, setProject] = useState<Project | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [dateRangeFilter, setDateRangeFilter] = useState('24h')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [showLevelDropdown, setShowLevelDropdown] = useState(false)
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false)
  const [showCustomDateRange, setShowCustomDateRange] = useState(false)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [streamConnected, setStreamConnected] = useState(false)

  // Initialize filters from URL
  useEffect(() => {
    const service = searchParams.get('service') as ServiceFilter | null
    const level = searchParams.get('level') as LevelFilter | null
    const dateRange = searchParams.get('dateRange')
    const start = searchParams.get('start_date')
    const end = searchParams.get('end_date')

    if (service) setServiceFilter(service)
    if (level) setLevelFilter(level)
    if (dateRange) setDateRangeFilter(dateRange)
    if (start) setCustomStartDate(start)
    if (end) setCustomEndDate(end)
  }, [searchParams])

  // Update URL when filters change
  const updateFilters = useCallback((updates: {
    service?: ServiceFilter
    level?: LevelFilter
    dateRange?: string
    start_date?: string
    end_date?: string
  }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (updates.service !== undefined) {
      params.set('service', updates.service)
    }
    if (updates.level !== undefined) {
      params.set('level', updates.level)
    }
    if (updates.dateRange !== undefined) {
      params.set('dateRange', updates.dateRange)
    }
    if (updates.start_date !== undefined) {
      if (updates.start_date) {
        params.set('start_date', updates.start_date)
      } else {
        params.delete('start_date')
      }
    }
    if (updates.end_date !== undefined) {
      if (updates.end_date) {
        params.set('end_date', updates.end_date)
      } else {
        params.delete('end_date')
      }
    }

    router.replace(`/dashboard/projects/${params.slug}/logs?${params.toString()}`, { scroll: false })
  }, [searchParams, router, params.slug])

  useEffect(() => {
    fetchProject()
    if (project?.id) {
      connectToLogStream()
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [params.slug, project?.id, serviceFilter, levelFilter, dateRangeFilter, customStartDate, customEndDate])

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
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError(data.error || 'Failed to load project')
        return
      }
      const data = await res.json()
      setProject(data.project)
    } catch (err) {
      console.error('Failed to fetch project:', err)
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      case 'warn':
        return <AlertTriangle className="w-4 h-4" />
      case 'info':
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warn':
        return 'bg-amber-50 border-amber-200'
      case 'info':
      default:
        return 'bg-slate-50 border-slate-200'
    }
  }

  const getLevelTextColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-700'
      case 'warn':
        return 'text-amber-700'
      case 'info':
      default:
        return 'text-slate-600'
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.request_id && log.request_id.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesService = serviceFilter === 'all' || log.service === serviceFilter
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter

    return matchesSearch && matchesService && matchesLevel
  })

  const handleDownload = () => {
    setDownloading(true)

    // Simulate download delay
    setTimeout(() => {
      const dataToDownload = filteredLogs
      const jsonContent = JSON.stringify(dataToDownload, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `logs-${project?.slug}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setDownloading(false)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2000)
    }, 500)
  }

  const toggleLogExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600">Loading project...</span>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-2">Project not found</p>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <Link href="/dashboard" className="text-emerald-700 hover:text-emerald-800">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/projects/${project.slug}`}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Logs</h1>
                <p className="text-xs text-slate-500">{project.name}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs by message, service, or request ID..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Service Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowServiceDropdown(!showServiceDropdown)
                  setShowLevelDropdown(false)
                }}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition min-w-[160px] justify-between"
              >
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm">
                  {serviceOptions.find((opt) => opt.value === serviceFilter)?.label}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showServiceDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                  {serviceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setServiceFilter(option.value)
                        setShowServiceDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${
                        serviceFilter === option.value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Level Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowLevelDropdown(!showLevelDropdown)
                  setShowServiceDropdown(false)
                }}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition min-w-[140px] justify-between"
              >
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm">
                  {levelOptions.find((opt) => opt.value === levelFilter)?.label}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showLevelDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[140px]">
                  {levelOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setLevelFilter(option.value)
                        setShowLevelDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${
                        levelFilter === option.value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={filteredLogs.length === 0 || downloading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                filteredLogs.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-700 text-white hover:bg-emerald-800'
              }`}
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Downloading...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Download</span>
                </>
              )}
            </button>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-slate-500">
            Showing {filteredLogs.length} of {logs.length} log entries
          </div>
        </div>

        {/* Log Stream */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No logs found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery || serviceFilter !== 'all' || levelFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Logs will appear here as they are generated'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 border-l-4 ${getLevelBgColor(log.level)} cursor-pointer hover:shadow-sm transition`}
                  onClick={() => toggleLogExpand(log.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Level Icon */}
                    <div className={`mt-0.5 ${getLevelTextColor(log.level)}`}>
                      {getLevelIcon(log.level)}
                    </div>

                    {/* Log Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono px-2 py-0.5 bg-white rounded border border-slate-200 uppercase">
                          {log.service}
                        </span>
                        <span className={`text-xs font-semibold uppercase ${getLevelTextColor(log.level)}`}>
                          {log.level}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 break-words">{log.message}</p>

                      {/* Expanded Details */}
                      {expandedLogId === log.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 p-4 bg-white rounded-lg border border-slate-200 text-sm"
                        >
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium text-slate-700">Request ID:</span>
                              <code className="ml-2 text-xs text-slate-600">{log.request_id || 'N/A'}</code>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Timestamp:</span>
                              <span className="ml-2 text-xs text-slate-600">{log.timestamp}</span>
                            </div>
                          </div>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-4">
                              <span className="font-medium text-slate-700">Metadata:</span>
                              <pre className="mt-2 p-3 bg-slate-900 rounded-lg overflow-x-auto">
                                <code className="text-xs text-emerald-400">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </code>
                              </pre>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Expand Icon */}
                    <div className="text-slate-400">
                      <motion.div
                        animate={{ rotate: expandedLogId === log.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Real-time Log Streaming</p>
              <p>
                This page shows mock log data for demonstration. In production, logs will stream in real-time via WebSocket connection.
                Logs are retained for 30 days and can be filtered by service, level, and searched by content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
