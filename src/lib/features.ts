/**
 * Feature Flag Helper
 *
 * Provides a simple interface for checking if features are enabled.
 * Supports global, project, and organization-scoped flags with caching.
 *
 * US-002: Create Feature Flag Helper
 */

import { getPool } from './db';

/**
 * Feature flag scope types
 */
export type FeatureFlagScope = 'global' | 'project' | 'org';

/**
 * Feature flag database row
 */
interface FeatureFlagRow {
  name: string;
  enabled: boolean;
  scope: FeatureFlagScope;
  metadata: Record<string, unknown>;
}

/**
 * Cache entry for feature flags
 */
interface CacheEntry {
  value: boolean;
  expiresAt: number;
}

/**
 * In-memory cache for feature flag values
 * Key format: "{name}:{scope}:{scopeId}" or "{name}:global" for global flags
 */
const flagCache = new Map<string, CacheEntry>();

/**
 * Cache TTL in milliseconds (60 seconds)
 */
const CACHE_TTL = 60 * 1000;

/**
 * Get cache key for a feature flag
 */
function getCacheKey(name: string, scope: FeatureFlagScope, scopeId?: string): string {
  if (scope === 'global') {
    return `${name}:global`;
  }
  return `${name}:${scope}:${scopeId}`;
}

/**
 * Get cached flag value if available and not expired
 */
function getCachedValue(name: string, scope: FeatureFlagScope, scopeId?: string): boolean | null {
  const key = getCacheKey(name, scope, scopeId);
  const entry = flagCache.get(key);

  if (entry && entry.expiresAt > Date.now()) {
    return entry.value;
  }

  // Remove expired entry
  if (entry) {
    flagCache.delete(key);
  }

  return null;
}

/**
 * Set cached flag value with expiration
 */
function setCachedValue(name: string, scope: FeatureFlagScope, value: boolean, scopeId?: string): void {
  const key = getCacheKey(name, scope, scopeId);
  flagCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

/**
 * Invalidate cache for a specific flag or all flags
 */
export function invalidateFlagCache(name?: string): void {
  if (name) {
    // Invalidate all cache entries for this flag name
    const keysToDelete: string[] = [];
    for (const key of flagCache.keys()) {
      if (key.startsWith(`${name}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => flagCache.delete(key));
  } else {
    // Invalidate all flags
    flagCache.clear();
  }
}

/**
 * Fetch feature flag from database
 */
async function fetchFlag(name: string, scope: FeatureFlagScope, scopeId?: string): Promise<boolean> {
  const pool = getPool();

  let query = '';
  let params: (string | number)[] = [];

  if (scope === 'global') {
    // Check global flag
    query = `
      SELECT enabled, scope
      FROM control_plane.feature_flags
      WHERE name = $1 AND scope = 'global'
    `;
    params = [name];
  } else {
    // For project/org scope, check both specific scope and global
    // Specific scope takes precedence over global
    query = `
      SELECT enabled, scope
      FROM control_plane.feature_flags
      WHERE name = $1 AND (scope = $2 OR scope = 'global')
      ORDER BY scope DESC
      LIMIT 1
    `;
    params = [name, scope];
  }

  try {
    const result = await pool.query<FeatureFlagRow>(query, params);

    if (result.rows.length === 0) {
      // Default to enabled if flag not found
      return true;
    }

    return result.rows[0].enabled;
  } catch (error) {
    // On database error, default to enabled for safety
    console.error(`Error fetching feature flag "${name}":`, error);
    return true;
  }
}

/**
 * Check if a feature flag is enabled
 *
 * @param name - The feature flag name
 * @param scope - The scope of the flag (global, project, org)
 * @param scopeId - The ID of the project or org (required for non-global scopes)
 * @returns boolean indicating if the feature is enabled
 *
 * @example
 * ```ts
 * // Check global flag
 * const signupsEnabled = await checkFeature('signups_enabled');
 *
 * // Check project-specific flag
 * const storageEnabled = await checkFeature('storage_enabled', 'project', 'proj_123');
 * ```
 */
export async function checkFeature(
  name: string,
  scope: FeatureFlagScope = 'global',
  scopeId?: string
): Promise<boolean> {
  // Check cache first
  const cached = getCachedValue(name, scope, scopeId);
  if (cached !== null) {
    return cached;
  }

  // Fetch from database
  const enabled = await fetchFlag(name, scope, scopeId);

  // Cache the result
  setCachedValue(name, scope, enabled, scopeId);

  return enabled;
}

/**
 * Synchronous version of checkFeature that only uses cache
 * Returns null if flag not in cache
 *
 * Useful for high-performance scenarios where a cache miss is acceptable
 *
 * @param name - The feature flag name
 * @param scope - The scope of the flag (global, project, org)
 * @param scopeId - The ID of the project or org (required for non-global scopes)
 * @returns boolean indicating if the feature is enabled, or null if not cached
 */
export function checkFeatureSync(
  name: string,
  scope: FeatureFlagScope = 'global',
  scopeId?: string
): boolean | null {
  return getCachedValue(name, scope, scopeId);
}

/**
 * Set a feature flag value
 * This is primarily used by admin interfaces to update flags
 *
 * @param name - The feature flag name
 * @param enabled - Whether the feature should be enabled
 * @param scope - The scope of the flag (global, project, org)
 * @param scopeId - The ID of the project or org (required for non-global scopes)
 */
export async function setFeatureFlag(
  name: string,
  enabled: boolean,
  scope: FeatureFlagScope = 'global',
  scopeId?: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const pool = getPool();

  const query = `
    INSERT INTO control_plane.feature_flags (name, enabled, scope, metadata)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (name) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      updated_at = NOW(),
      metadata = EXCLUDED.metadata
  `;

  await pool.query(query, [name, enabled, scope, JSON.stringify(metadata)]);

  // Invalidate cache for this flag
  invalidateFlagCache(name);
}

/**
 * Get all feature flags
 *
 * @param scope - Optional scope filter
 * @param scopeId - Optional scope ID filter
 * @returns Array of feature flags
 */
export async function getFeatureFlags(
  scope?: FeatureFlagScope,
  scopeId?: string
): Promise<FeatureFlagRow[]> {
  const pool = getPool();

  let query = 'SELECT name, enabled, scope, metadata FROM control_plane.feature_flags';
  const params: (string | number)[] = [];

  if (scope) {
    query += ' WHERE scope = $1';
    params.push(scope);
  }

  query += ' ORDER BY name';

  const result = await pool.query<FeatureFlagRow>(query, params);
  return result.rows;
}
