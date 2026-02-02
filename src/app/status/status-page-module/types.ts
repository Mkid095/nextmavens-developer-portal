/**
 * Status Page - Module - Types
 */

export type ServiceStatusType = 'operational' | 'degraded' | 'outage'
export type IncidentStatus = 'active' | 'resolved'
export type IncidentImpact = 'high' | 'medium' | 'low'

export interface ServiceStatus {
  service: string
  status: ServiceStatusType
  last_updated: string
  message: string | null
}

export interface Incident {
  id: string
  service: string
  status: IncidentStatus
  title: string
  description: string | null
  impact: IncidentImpact
  started_at: string
  resolved_at: string | null
  affected_services: unknown
  created_at: string
}

export interface StatusResponse {
  services: ServiceStatus[]
  incidents: Incident[]
  overall_status: ServiceStatusType
  last_updated: string
}

export interface StatusConfig {
  icon: any
  color: string
  bgColor: string
  label: string
}
