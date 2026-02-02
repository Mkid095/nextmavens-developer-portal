/**
 * Realtime Usage Tracking Types
 */

export type RealtimeMetricType = 'realtime_message' | 'realtime_connection'

export interface RealtimeUsageMetric {
  projectId: string
  metricType: RealtimeMetricType
  quantity: number
}

export interface RealtimeUsageStatsData {
  messageCount: number
  connectionCount: number
  breakdownByDay: Array<{
    date: string
    messageCount: number
    connectionCount: number
  }>
  breakdownByHour: Array<{
    hour: string
    messageCount: number
    connectionCount: number
  }>
}

export interface RealtimeUsageStatsResult {
  success: boolean
  data?: RealtimeUsageStatsData
  error?: string
}

export interface CurrentRealtimeUsageData {
  messageCount: number
  connectionCount: number
}

export interface CurrentRealtimeUsageResult {
  success: boolean
  data?: CurrentRealtimeUsageData
  error?: string
}

export interface CurrentHourConnectionData {
  connectionCount: number
}

export interface CurrentHourConnectionResult {
  success: boolean
  data?: CurrentHourConnectionData
  error?: string
}
