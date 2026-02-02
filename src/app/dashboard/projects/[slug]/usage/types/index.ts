/**
 * Usage Dashboard Types
 * Type definitions for the usage dashboard
 */

export interface UsageResponse {
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

export interface ServiceUsage {
  service: string
  total_quantity: number
  metric_breakdown: MetricBreakdown[]
}

export interface MetricBreakdown {
  metric_type: string
  quantity: number
}

export interface MetricUsage {
  metric_type: string
  total_quantity: number
}

export interface TimeSeriesEntry {
  period: string
  service: string
  metric_type: string
  quantity: number
}

export interface QuotaInfo {
  service: string
  current_usage: number
  monthly_limit: number
  hard_cap: number
  usage_percentage: number
  reset_at: string
}

export interface Project {
  id: string
  name: string
  slug: string
}

export type AggregationType = 'day' | 'week' | 'month'
