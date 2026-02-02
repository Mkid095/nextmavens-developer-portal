/**
 * Feature Flag Helper
 *
 * Provides a simple interface for checking if features are enabled.
 * Supports global, project, and organization-scoped flags with caching.
 *
 * US-002: Create Feature Flag Helper
 */

export type { FeatureFlagScope } from './features/types'
export type { FeatureFlagRow, CacheEntry } from './features/types'

export {
  checkFeature,
  checkFeatureSync,
  setFeatureFlag,
  getFeatureFlags,
  getProjectFeatureFlags,
  deleteFeatureFlag,
} from './features/database'

export { invalidateFlagCache, getCacheSize, getCacheEntries } from './features/cache'
