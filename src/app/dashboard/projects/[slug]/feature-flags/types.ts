/**
 * Feature Flags Page Types
 * Type definitions for feature flags management
 */

export interface FeatureFlag {
  name: string
  enabled: boolean
  scope: 'global' | 'project' | 'org'
  scope_id?: string
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
