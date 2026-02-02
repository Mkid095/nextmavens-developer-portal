/**
 * Support Request Modal - Type Definitions
 */

export interface SupportRequestModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

export interface SupportContext {
  project: {
    id: string
    name: string
    status: string
    tenant_slug: string
  }
  recent_errors: Array<{
    id: string
    timestamp: string
    service: string
    message: string
  }>
  usage_metrics: Record<string, {
    current_usage: number
    monthly_limit: number
    usage_percentage: number
  }>
  logs_snippet: Array<{
    id: string
    timestamp: string
    service: string
    level: string
    message: string
  }>
}

export interface SubmitResponse {
  request_id: string
  status: string
}

export interface FormState {
  subject: string
  description: string
  error: string
  success: boolean
  submitting: boolean
  requestId: string | null
}

export interface ModalState {
  context: SupportContext | null
  loadingContext: boolean
}
