'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import type {
  Project,
  ServiceFilter,
  LevelFilter,
  DateRangeFilter,
  ChartGroupBy,
  ChartData,
} from './types'
import { serviceOptions, levelOptions, dateRangeOptions } from './constants'
import { LogsPageHeader } from './components/LogsPageHeader'
import { LogsPageLoading } from './components/LogsPageLoading'
import { LogsPageError } from './components/LogsPageError'
import { LogFilters } from './components/LogFilters'
import { LogChart } from './components/LogChart'
import { LogTable } from './components/LogTable'
import { LogsInfoBanner } from './components/LogsInfoBanner'
import { useLogStream } from './hooks/useLogStream'
import { useLogPagination } from './hooks/useLogPagination'
import { useLogDownload } from './hooks/useLogDownload'

export default function LogsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Project state
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('24h')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Use download hook
  const {
    downloadFormat,
    setDownloadFormat,
    downloading,
    downloadSuccess,
    handleDownload,
  } = useLogDownload({
    project,
    serviceFilter,
    levelFilter,
    searchQuery,
    dateRangeFilter,
    customStartDate,
    customEndDate,
  })

  // Chart states
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [chartLoading, setChartLoading] = useState(false)
  const [chartGroupBy, setChartGroupBy] = useState<ChartGroupBy>('level')
  const [showCharts, setShowCharts] = useState(true)

  // Expanded log state
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  // Initialize filters from URL
  useEffect(() => {
    const service = searchParams.get('service') as ServiceFilter | null
    const level = searchParams.get('level') as LevelFilter | null
    const dateRange = searchParams.get('dateRange') as DateRangeFilter | null

    if (service && serviceOptions.some((opt) => opt.value === service)) setServiceFilter(service)
    if (level && levelOptions.some((opt) => opt.value === level)) setLevelFilter(level)
    if (dateRange && dateRangeOptions.some((opt) => opt.value === dateRange)) setDateRangeFilter(dateRange)
  }, [searchParams])

  // Fetch project on mount
  useEffect(() => {
    fetchProject()
  }, [params.slug])

  // Use log stream hook
  const { logs, connecting } = useLogStream({
    projectId: project?.id,
    serviceFilter,
    levelFilter,
    dateRangeFilter,
    customStartDate,
    customEndDate,
  })

  // Use pagination hook
  const { displayedLogs, loadingMore, hasMore, totalLogCount, loadMore } = useLogPagination(logs)

  // Fetch chart data when dependencies change
  useEffect(() => {
    if (project && showCharts) {
      fetchChartData()
    }
  }, [project, serviceFilter, levelFilter, dateRangeFilter, customStartDate, customEndDate, chartGroupBy, showCharts])

  // Fetch project data
  async function fetchProject() {
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

  // Fetch chart data
  async function fetchChartData() {
    if (!project) return

    setChartLoading(true)
    try {
      const token = localStorage.getItem('accessToken')

      const urlParams = new URLSearchParams()
      urlParams.append('project_id', project.id)
      urlParams.append('group_by', chartGroupBy)

      const { startDate, endDate } = getDateRange(dateRangeFilter, customStartDate, customEndDate)
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

  // Filter logs by search query
  const filteredLogs = displayedLogs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.request_id && log.request_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  const toggleLogExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId)
  }

  // Loading state
  if (loading) {
    return <LogsPageLoading />
  }

  // Error state
  if (!project) {
    return <LogsPageError error={error} />
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <LogsPageHeader project={project} connecting={connecting} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <LogFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          serviceFilter={serviceFilter}
          onServiceChange={setServiceFilter}
          levelFilter={levelFilter}
          onLevelChange={setLevelFilter}
          dateRangeFilter={dateRangeFilter}
          onDateRangeChange={setDateRangeFilter}
          customStartDate={customStartDate}
          onCustomStartDateChange={setCustomStartDate}
          customEndDate={customEndDate}
          onCustomEndDateChange={setCustomEndDate}
          downloadFormat={downloadFormat}
          onDownloadFormatChange={setDownloadFormat}
          onDownload={handleDownload}
          filteredLogsCount={filteredLogs.length}
          totalLogCount={totalLogCount}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          isDownloading={downloading}
          downloadSuccess={downloadSuccess}
        />

        {/* Charts */}
        <LogChart
          chartData={chartData}
          chartLoading={chartLoading}
          chartGroupBy={chartGroupBy}
          onGroupByChange={setChartGroupBy}
          showCharts={showCharts}
          onShowChartsChange={setShowCharts}
        />

        {/* Log Table */}
        <LogTable
          filteredLogs={filteredLogs}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
          expandedLogId={expandedLogId}
          onToggleLogExpand={toggleLogExpand}
          searchQuery={searchQuery}
          connecting={connecting}
        />

        {/* Info Banner */}
        <LogsInfoBanner />
      </div>
    </div>
  )
}
