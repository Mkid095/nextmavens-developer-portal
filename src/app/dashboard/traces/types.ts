/**
 * Traces Page Types
 * Type definitions for request traces
 */

export interface RequestTrace {
  request_id: string
  project_id: string
  path: string
  method: string
  services_hit: string[]
  total_duration_ms: number | null
  created_at: string
}

export interface TraceDetail {
  success: boolean
  data?: RequestTrace
  error?: {
    code: string
    message: string
  }
}

export interface ServiceDuration {
  service: string
  duration: number
  startTime: number
  endTime: number
}
