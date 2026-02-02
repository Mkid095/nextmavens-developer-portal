/**
 * Admin Support Page Types
 * Type definitions for support request management
 */

export type Status = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed'

export interface SupportRequest {
  id: string
  project_id: string
  project_name: string
  tenant_slug: string
  user_id: string
  user_email: string
  user_name: string
  subject: string
  description: string
  context: any
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  previous_status: string | null
  admin_notes: string | null
  created_at: string
  resolved_at: string | null
}

export interface SupportRequestsResponse {
  requests: SupportRequest[]
  total: number
}

export interface StatusBadgeProps {
  status: string
}

export interface RequestDetailModalProps {
  request: SupportRequest
  onClose: () => void
  onUpdate: () => void
}
