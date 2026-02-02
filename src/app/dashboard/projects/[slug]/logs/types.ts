/**
 * Logs Page Types
 *
 * Type definitions for the logs viewer page.
 */

export interface Project {
  id: string
  name: string
  slug: string
  tenant_id: string
  created_at: string
}

export interface LogEntry {
  id: string
  timestamp: string
  service: string
  level: 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, unknown>
  request_id?: string
}

export type ServiceFilter = 'all' | 'db' | 'auth' | 'realtime' | 'storage' | 'graphql'
export type LevelFilter = 'all' | 'info' | 'warn' | 'error'
export type DateRangeFilter = '1h' | '24h' | '7d' | '30d' | 'custom'
export type DownloadFormat = 'json' | 'text'
export type ChartGroupBy = 'level' | 'service'

export interface ChartDataPoint {
  timestamp: string
  count: number
  level?: string
  service?: string
}

export interface ChartData {
  data: ChartDataPoint[]
  timeRange: {
    start: string
    end: string
  }
  totalLogs: number
  groupBy: ChartGroupBy
}

export interface LogFilters {
  service: ServiceFilter
  level: LevelFilter
  dateRange: DateRangeFilter
  searchQuery: string
}

export interface ServiceOption {
  value: ServiceFilter
  label: string
}

export const serviceOptions: ServiceOption[] = [
  { value: 'all', label: 'All Services' },
  { value: 'db', label: 'Database' },
  { value: 'auth', label: 'Auth' },
  { value: 'realtime', label: 'Realtime' },
  { value: 'storage', label: 'Storage' },
  { value: 'graphql', label: 'GraphQL' },
]

export const levelOptions: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warning' },
  { value: 'error', label: 'Error' },
]

export const dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
  { value: '1h', label: 'Last 1 Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
]
