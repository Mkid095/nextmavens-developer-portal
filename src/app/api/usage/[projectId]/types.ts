/**
 * Usage API Types
 */

export type Service = 'db' | 'realtime' | 'storage' | 'auth' | 'function'
export type Aggregation = 'day' | 'week' | 'month'

export interface UsageRequestParams {
  projectId: string
  service?: string
  metric_type?: string
  start_date?: string
  end_date?: string
  aggregation?: string
  days?: string
}

export interface UsageResponse {
  project_id: string
  period: {
    start_date: string
    end_date: string
    aggregation: string
  }
  usage: {
    total_by_service: Array<{
      service: string
      total_quantity: number
      metric_breakdown: Array<{
        metric_type: string
        quantity: number
      }>
    }>
    total_by_metric: Array<{
      metric_type: string
      total_quantity: number
    }>
    time_series: Array<{
      period: string
      service: string
      metric_type: string
      quantity: number
    }>
  }
  quota?: Array<{
    service: string
    current_usage: number
    monthly_limit: number
    hard_cap: number
    usage_percentage: number
    reset_at: string
  }>
}

export interface ParsedQueryParams {
  startDate: Date
  endDate: Date
  aggregation: Aggregation
  filters: { service?: string; metric_type?: string }
}
