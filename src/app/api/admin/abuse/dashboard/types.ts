/**
 * Abuse Dashboard API - Type Definitions
 */

export interface DashboardStatsResponse {
  time_range: string
  start_time: Date
  end_time: Date
  suspensions: SuspensionsStats
  rate_limits: RateLimitsStats
  cap_violations: CapViolationsStats
  approaching_caps: ApproachingCapsStats
  suspicious_patterns: PatternsStats
}

export interface SuspensionsStats {
  total: number
  active: number
  by_type: Record<string, number>
}

export interface RateLimitsStats {
  total: number
  by_type: Record<string, number>
}

export interface CapViolationsStats {
  total: number
  violations: CapViolation[]
}

export interface CapViolation {
  project_id: string
  project_name: string
  organization: string
  cap_exceeded: string
  reason: unknown
  suspended_at: Date
}

export interface ApproachingCapsStats {
  total: number
  projects: ApproachingCap[]
}

export interface ApproachingCap {
  project_id: string
  project_name: string
  organization: string
  cap_type: string
  cap_value: number
  current_usage: number
  usage_percentage: number
}

export interface PatternsStats {
  total: number
  by_type: Record<string, number>
  by_severity: Record<string, number>
  recent: PatternDetection[]
}

export interface PatternDetection {
  project_id: string
  project_name: string
  organization: string
  pattern_type: string
  severity: string
  occurrence_count: number
  description: string
  detected_at: Date
}

export interface TimeRange {
  hours: number
  label: string
}
