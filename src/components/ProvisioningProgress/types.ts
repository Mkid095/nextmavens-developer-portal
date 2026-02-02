/**
 * Provisioning Progress Types
 */

export interface ProvisioningStepResponse {
  step_name: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  error_details: Record<string, unknown> | null
  retry_count: number
  created_at: string
}

export interface ProvisioningProgressResponse {
  project_id: string
  project_name: string
  progress: number
  steps: ProvisioningStepResponse[]
}

export interface ProvisioningProgressProps {
  projectId: string
  projectName: string
  onComplete?: () => void
  onFailed?: () => void
  className?: string
}

export interface ProvisioningProgressBarProps {
  projectId: string
  className?: string
}
