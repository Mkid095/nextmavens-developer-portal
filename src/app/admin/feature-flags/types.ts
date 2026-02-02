/**
 * Feature Flags Page - Type Definitions
 */

export interface FeatureFlag {
  name: string
  enabled: boolean
  scope: 'global' | 'project' | 'org'
  metadata: Record<string, unknown>
}

export interface FlagsResponse {
  success: boolean
  flags?: FeatureFlag[]
  error?: string
  code?: string
  details?: string
}

export interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}
