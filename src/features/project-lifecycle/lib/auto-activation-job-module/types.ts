/**
 * Auto-Activation Job Module - Types
 */

/**
 * Auto-activation job result interface
 */
export interface AutoActivationJobResult {
  /** Whether the job completed successfully */
  success: boolean
  /** Timestamp when the job started */
  startedAt: Date
  /** Timestamp when the job completed */
  completedAt: Date
  /** Duration in milliseconds */
  durationMs: number
  /** Number of CREATED projects checked */
  projectsChecked: number
  /** Number of projects auto-activated */
  projectsActivated: number
  /** Details of activated projects */
  activatedProjects: Array<{
    projectId: string
    projectName: string
    activatedAt: Date
  }>
  /** Number of projects with failed provisioning */
  failedProvisioning: number
  /** Error message if job failed */
  error?: string
}

/**
 * Project ready for activation
 */
export interface ProjectReadyForActivation {
  projectId: string
  projectName: string
  ownerName: string
  createdAt: Date
}

/**
 * Created project from database
 */
export interface CreatedProject {
  id: string
  project_name: string
  status: string
  owner_id: string
}
