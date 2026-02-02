/**
 * Abuse Dashboard - Type Definitions
 */

export interface DashboardData {
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

export type TimeRange = '24h' | '7d' | '30d'
