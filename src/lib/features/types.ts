/**
 * Feature Flag Types
 */

export type FeatureFlagScope = 'global' | 'project' | 'org'

export interface FeatureFlagRow {
  name: string
  enabled: boolean
  scope: FeatureFlagScope
  metadata: Record<string, unknown>
  scope_id?: string
}

export interface CacheEntry {
  value: boolean
  expiresAt: number
}
