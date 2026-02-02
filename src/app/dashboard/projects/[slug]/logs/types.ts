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
  metadata?: Record<string, any>
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
  groupBy: 'level' | 'service'
}

export interface DateRange {
  startDate: string
  endDate: string
}
