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
  ChevronDown as ChevronDownIcon,
  FileJson,
  FileCode,
  BarChart3,
} from 'lucide-react'

/**
 * Highlight search terms in text
 * @param text - The text to highlight
 * @param query - The search query to highlight
 * @returns JSX with highlighted matches
 */
function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <mark key={index} className="bg-yellow-200 text-slate-900 rounded px-0.5">
          {part}
        </mark>
      )
    }
    return part
  })
}

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
type DateRangeFilter = '1h' | '24h' | '7d' | '30d' | 'custom'
type DownloadFormat = 'json' | 'text'
type ChartGroupBy = 'level' | 'service'

interface ChartDataPoint {
  timestamp: string
  count: number
  level?: string
  service?: string
}

interface ChartData {
  data: ChartDataPoint[]
  timeRange: {
    start: string
    end: string
  }
  totalLogs: number
  groupBy: 'level' | 'service'
}

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
const dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
]

// Color palette for charts
const CHART_COLORS: Record<string, string> = {
  info: '#10b981', // emerald-500
  warn: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  db: '#3b82f6', // blue-500
  auth: '#8b5cf6', // violet-500
  realtime: '#ec4899', // pink-500
  storage: '#f97316', // orange-500
  graphql: '#14b8a6', // teal-500
}

/**
 * SimpleBarChart Component
 *
 * A lightweight SVG bar chart for visualizing log data.
 * Shows log volume over time grouped by level or service.
 */
function SimpleBarChart({
  data,
  groupBy,
}: {
  data: ChartData
  groupBy: 'level' | 'service'
}) {
  if (!data.data || data.data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        No chart data available
      </div>
    )
  }

  // Group data by timestamp
  const groupedByTime: Record<string, ChartDataPoint[]> = {}
  data.data.forEach((point) => {
    const timestamp = point.timestamp.split(':')[0] + ':00:00' // Round to hour
    if (!groupedByTime[timestamp]) {
      groupedByTime[timestamp] = []
    }
    groupedByTime[timestamp].push(point)
  })

  // Get sorted timestamps
  const timestamps = Object.keys(groupedByTime).sort()
  const uniqueGroups = Array.from(
    new Set(data.data.map((d) => (groupBy === 'level' ? d.level : d.service)))
  ).filter(Boolean) as string[]

  // Calculate max count for scaling
  const maxCount = Math.max(...data.data.map((d) => d.count), 1)

  // Chart dimensions
  const chartHeight = 200
  const chartWidth = 700
  const barWidth = Math.max(10, (chartWidth - 60) / timestamps.length / uniqueGroups.length - 2)
  const groupGap = 4

  return (
    <div className="w-full overflow-x-auto">
      <svg width={chartWidth} height={chartHeight + 40} className="mx-auto">
        {/* Y-axis labels and grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const y = chartHeight - (chartHeight * percent) / 100
          const value = Math.round((maxCount * percent) / 100)
          return (
            <g key={percent}>
              <line
                x1={40}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={percent === 0 ? '0' : '4,4'}
              />
              <text
                x={35}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
                fontFamily="monospace"
              >
                {value}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {timestamps.map((timestamp, i) => {
          const x = 50 + i * ((barWidth + groupGap) * uniqueGroups.length + groupGap)
          const points = groupedByTime[timestamp] || []

          return (
            <g key={timestamp}>
              {uniqueGroups.map((group, j) => {
                const point = points.find(
                  (p) => (groupBy === 'level' ? p.level : p.service) === group
                )
                const count = point?.count || 0
                const barHeight = (count / maxCount) * chartHeight
                const y = chartHeight - barHeight
                const barX = x + j * (barWidth + groupGap)
                const color = CHART_COLORS[group] || '#64748b'

                return (
                  <g key={group}>
                    <rect
                      x={barX}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={color}
                      opacity="0.8"
                      rx="2"
                    />
                    {/* Tooltip */}
                    {count > 0 && (
                      <title>
                        {timestamp}\n{group}: {count} logs
                      </title>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* X-axis labels (show every few timestamps to avoid crowding) */}
        {timestamps
          .filter((_, i) => i % Math.ceil(timestamps.length / 6) === 0)
          .map((timestamp, i) => {
            const index = timestamps.indexOf(timestamp)
            const x = 50 + index * ((barWidth + groupGap) * uniqueGroups.length + groupGap)
            const date = new Date(timestamp)
            const label = date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
            return (
              <text
                key={timestamp}
                x={x + (barWidth * uniqueGroups.length) / 2}
                y={chartHeight + 15}
                textAnchor="middle"
                fontSize="9"
                fill="#64748b"
              >
                {label}
              </text>
            )
          })}

        {/* Legend */}
        <g transform={`translate(${chartWidth - 150}, 10)`}>
          {uniqueGroups.map((group, i) => (
            <g key={group} transform={`translate(0, ${i * 16})`}>
              <rect width="12" height="12" fill={CHART_COLORS[group] || '#64748b'} rx="2" />
              <text x="18" y="10" fontSize="10" fill="#475569" fontWeight="500">
                {group}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

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
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('24h')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [showLevelDropdown, setShowLevelDropdown] = useState(false)
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false)
  const [showCustomDateRange, setShowCustomDateRange] = useState(false)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<'json' | 'text'>('json')
  const [showDownloadFormatDropdown, setShowDownloadFormatDropdown] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>([])
  const [pageSize] = useState(100)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalLogCount, setTotalLogCount] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [chartLoading, setChartLoading] = useState(false)
  const [chartGroupBy, setChartGroupBy] = useState<ChartGroupBy>('level')
  const [showCharts, setShowCharts] = useState(true)

  // Initialize filters from URL
  useEffect(() => {
    const service = searchParams.get('service') as ServiceFilter | null
    const level = searchParams.get('level') as LevelFilter | null
    const dateRange = searchParams.get('dateRange') as DateRangeFilter | null

    if (service && serviceOptions.some(opt => opt.value === service)) setServiceFilter(service)
    if (level && levelOptions.some(opt => opt.value === level)) setLevelFilter(level)
    if (dateRange && dateRangeOptions.some(opt => opt.value === dateRange)) setDateRangeFilter(dateRange)
  }, [searchParams])

  useEffect(() => {
    fetchProject()
  }, [params.slug])

  // Update displayed logs when logs change
  useEffect(() => {
    setDisplayedLogs(logs.slice(0, pageSize))
    setHasMore(logs.length > pageSize)
    setTotalLogCount(logs.length)
  }, [logs, pageSize])

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayedLogs([])
    setHasMore(true)
  }, [serviceFilter, levelFilter, dateRangeFilter, customStartDate, customEndDate])

  // SSE connection for real-time logs
  useEffect(() => {
    if (!project) return

    connectToLogStream()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [project, serviceFilter, levelFilter, dateRangeFilter, customStartDate, customEndDate])

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

  const getDateRange = (): { startDate: string; endDate: string } => {
    const now = new Date()
    let startDate = new Date()
    let endDate = now

    if (dateRangeFilter === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      endDate = new Date(customEndDate)
      endDate.setHours(23, 59, 59, 999)
    } else {
      switch (dateRangeFilter) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  }

  const fetchChartData = async () => {
    if (!project) return

    setChartLoading(true)
    try {
      const token = localStorage.getItem('accessToken')

      // Build query parameters
      const urlParams = new URLSearchParams()
      urlParams.append('project_id', project.id)
      urlParams.append('group_by', chartGroupBy)

      // Add date range filter
      const { startDate, endDate } = getDateRange()
      urlParams.append('start_date', startDate)
      urlParams.append('end_date', endDate)

      const res = await fetch(`/api/logs/charts?${urlParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        console.error('Failed to fetch chart data')
        return
      }

      const data: ChartData = await res.json()
      setChartData(data)
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
    } finally {
      setChartLoading(false)
    }
  }

  // Fetch chart data when project, filters, or chartGroupBy change
  useEffect(() => {
    if (project && showCharts) {
      fetchChartData()
    }
  }, [project, serviceFilter, levelFilter, dateRangeFilter, customStartDate, customEndDate, chartGroupBy, showCharts])

  const connectToLogStream = () => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setConnecting(true)
    setLogs([])

    // Build query parameters
    const urlParams = new URLSearchParams()
    urlParams.append('project_id', project.id)

    if (serviceFilter !== 'all') {
      urlParams.append('service', serviceFilter)
    }

    if (levelFilter !== 'all') {
      urlParams.append('level', levelFilter)
    }

    // Add date range filter
    const { startDate, endDate } = getDateRange()
    if (startDate) {
      urlParams.append('start_date', startDate)
    }
    if (endDate) {
      urlParams.append('end_date', endDate)
    }

    const streamUrl = '/api/logs/stream?' + urlParams.toString()

    try {
      const eventSource = new EventSource(streamUrl)
      eventSourceRef.current = eventSource

      eventSource.addEventListener('connected', () => {
        setConnecting(false)
      })

      eventSource.addEventListener('log', (event) => {
        try {
          const logEntry: LogEntry = JSON.parse(event.data)
          setLogs((prev) => {
            // Avoid duplicates
            if (prev.some((log) => log.id === logEntry.id)) {
              return prev
            }
            // Add new logs at the beginning
            return [logEntry, ...prev]
          })
        } catch (err) {
          console.error('Failed to parse log entry:', err)
        }
      })

      eventSource.onerror = () => {
        console.error('EventSource error')
        setConnecting(false)
        eventSource.close()
      }
    } catch (err) {
      console.error('Failed to create EventSource:', err)
      setConnecting(false)
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
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
      default:
        return 'bg-gray-50 border-gray-200'
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

  // Client-side filtering for search (filters are applied server-side via SSE)
  const filteredLogs = displayedLogs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.request_id && log.request_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  // Load more logs
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    setTimeout(() => {
      setDisplayedLogs((prev) => {
        const currentLength = prev.length
        const nextLogs = logs.slice(currentLength, currentLength + pageSize)
        const combined = [...prev, ...nextLogs]
        setHasMore(logs.length > combined.length)
        return combined
      })
      setLoadingMore(false)
    }, 300)
  }, [loadingMore, hasMore, logs, pageSize])

  // Auto-load on scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const trigger = loadMoreTriggerRef.current

    if (!scrollContainer || !trigger || !hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { root: scrollContainer, rootMargin: '200px', threshold: 0.1 }
    )

    observer.observe(trigger)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loadingMore, loadMore])

  const handleDownload = async () => {
    if (!project) return

    setDownloading(true)
    setDownloadSuccess(false)

    try {
      const token = localStorage.getItem('accessToken')

      // Build query parameters for server-side download
      const urlParams = new URLSearchParams()
      urlParams.append('project_id', project.id)
      urlParams.append('format', downloadFormat)

      // Add service filter
      if (serviceFilter !== 'all') {
        urlParams.append('service', serviceFilter)
      }

      // Add level filter
      if (levelFilter !== 'all') {
        urlParams.append('level', levelFilter)
      }

      // Add search query
      if (searchQuery) {
        urlParams.append('search', searchQuery)
      }

      // Add date range filter with 7-day max validation
      const { startDate, endDate } = getDateRange()
      urlParams.append('start_date', startDate)
      urlParams.append('end_date', endDate)

      // Validate date range doesn't exceed 7 days
      const start = new Date(startDate)
      const end = new Date(endDate)
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff > 7) {
        alert('Date range for download cannot exceed 7 days. Please adjust your filters.')
        setDownloading(false)
        return
      }

      // Fetch logs from backend
      const res = await fetch(`/api/logs/download?${urlParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Download failed' }))
        throw new Error(errorData.error || 'Failed to download logs')
      }

      // Get the blob from response
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Set filename based on format
      const extension = downloadFormat === 'json' ? 'json' : 'txt'
      link.download = `${project.slug}-logs-${new Date().toISOString().split('T')[0]}.${extension}`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to download logs:', error)
      alert(error instanceof Error ? error.message : 'Failed to download logs. Please try again.')
    } finally {
      setDownloading(false)
    }
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
            {connecting && (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </div>
            )}
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

            {/* Date Range Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowDateRangeDropdown(!showDateRangeDropdown)
                  setShowServiceDropdown(false)
                  setShowLevelDropdown(false)
                }}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition min-w-[160px] justify-between"
              >
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm">
                  {dateRangeOptions.find((opt) => opt.value === dateRangeFilter)?.label}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showDateRangeDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[200px]">
                  {dateRangeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setDateRangeFilter(option.value)
                        setShowDateRangeDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${
                        dateRangeFilter === option.value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Download Format Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowDownloadFormatDropdown(!showDownloadFormatDropdown)
                  setShowServiceDropdown(false)
                  setShowLevelDropdown(false)
                  setShowDateRangeDropdown(false)
                }}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition min-w-[140px] justify-between"
              >
                {downloadFormat === 'json' ? (
                  <FileJson className="w-4 h-4 text-slate-500" />
                ) : (
                  <FileCode className="w-4 h-4 text-slate-500" />
                )}
                <span className="text-sm uppercase">{downloadFormat}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showDownloadFormatDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[140px]">
                  <button
                    onClick={() => {
                      setDownloadFormat('json')
                      setShowDownloadFormatDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition flex items-center gap-2 ${
                      downloadFormat === 'json' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    <FileJson className="w-4 h-4" />
                    JSON
                  </button>
                  <button
                    onClick={() => {
                      setDownloadFormat('text')
                      setShowDownloadFormatDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition flex items-center gap-2 ${
                      downloadFormat === 'text' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    <FileCode className="w-4 h-4" />
                    Text
                  </button>
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

          {/* Custom Date Range Inputs */}
          {dateRangeFilter === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-4"
            >
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="datetime-local"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                />
              </div>
            </motion.div>
          )}

          {/* Results Count */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing {filteredLogs.length} of {totalLogCount} log entries
            </div>
            <div className="flex items-center gap-3">
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-sm text-emerald-700 hover:text-emerald-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <ChevronDownIcon className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Log Volume Chart</h2>
              {chartData && (
                <span className="text-sm text-slate-500">
                  ({chartData.totalLogs} logs)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Group By Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Group by:</span>
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setChartGroupBy('level')}
                    className={`px-3 py-1 text-sm rounded-md transition ${
                      chartGroupBy === 'level'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Level
                  </button>
                  <button
                    onClick={() => setChartGroupBy('service')}
                    className={`px-3 py-1 text-sm rounded-md transition ${
                      chartGroupBy === 'service'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Service
                  </button>
                </div>
              </div>
              {/* Show/Hide Toggle */}
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                {showCharts ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {showCharts && (
            <div className="mt-4">
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-emerald-700 animate-spin" />
                  <span className="ml-2 text-slate-600">Loading chart data...</span>
                </div>
              ) : chartData ? (
                <SimpleBarChart data={chartData} groupBy={chartGroupBy} />
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  No chart data available
                </div>
              )}
            </div>
          )}

          {/* Chart Legend */}
          {showCharts && chartData && chartData.data.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Time range:</span>
                  <span className="text-slate-900 font-medium">
                    {new Date(chartData.timeRange.start).toLocaleString()} - {new Date(chartData.timeRange.end).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Log Stream */}
        <div ref={scrollContainerRef} className="bg-white rounded-xl border border-slate-200 overflow-hidden max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No logs found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery || serviceFilter !== 'all' || levelFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : connecting
                  ? 'Connecting to log stream...'
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
                      <p className="text-sm text-slate-800 break-words">{highlightText(log.message, searchQuery)}</p>

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
                                  {searchQuery
                                    ? highlightText(JSON.stringify(log.metadata, null, 2), searchQuery)
                                    : JSON.stringify(log.metadata, null, 2)}
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

          {/* Load More Trigger (for auto-load on scroll) */}
          <div ref={loadMoreTriggerRef} className="h-4" />

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="py-6 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
              <span className="ml-2 text-sm text-slate-600">Loading more logs...</span>
            </div>
          )}

          {/* End of Logs Message */}
          {!hasMore && filteredLogs.length > 0 && (
            <div className="py-6 text-center text-sm text-slate-500">
              All logs loaded
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
                Logs are streaming in real-time via Server-Sent Events (SSE). Use the filters above to narrow down logs by service, level, and date range.
                Logs are retained for 30 days and can be downloaded for offline analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
