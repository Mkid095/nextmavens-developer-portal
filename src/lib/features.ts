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
  scope_id?: string;
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
 * For project/org scope, checks specific scope first, then falls back to global
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
  } else if (scopeId) {
    // For project/org scope with scopeId, check specific scope first
    // If not found, fall back to global flag
    // Project/org flags take precedence over global flags
    query = `
      SELECT enabled, scope
      FROM control_plane.feature_flags
      WHERE name = $1 AND (scope = $2 AND scope_id = $3) OR (scope = 'global')
      ORDER BY
        CASE
          WHEN scope = $2 AND scope_id = $3 THEN 1
          WHEN scope = 'global' THEN 2
          ELSE 3
        END
      LIMIT 1
    `;
    params = [name, scope, scopeId];
  } else {
    // For project/org scope without scopeId, just check global
    query = `
      SELECT enabled, scope
      FROM control_plane.feature_flags
      WHERE name = $1 AND scope = 'global'
    `;
    params = [name];
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
 * @returns The old value of the flag (or null if it didn't exist)
 */
export async function setFeatureFlag(
  name: string,
  enabled: boolean,
  scope: FeatureFlagScope = 'global',
  scopeId?: string,
  metadata: Record<string, unknown> = {}
): Promise<boolean | null> {
  const pool = getPool();

  // First, get the old value if it exists
  const selectQuery = `
    SELECT enabled
    FROM control_plane.feature_flags
    WHERE name = $1 AND scope = $2 ${scopeId ? 'AND scope_id = $3' : ''}
  `;

  let oldValue: boolean | null = null;
  try {
    const selectResult = await pool.query<{ enabled: boolean }>(
      selectQuery,
      scopeId ? [name, scope, scopeId] : [name, scope]
    );
    if (selectResult.rows.length > 0) {
      oldValue = selectResult.rows[0].enabled;
    }
  } catch (error) {
    // Ignore error, flag might not exist yet
    console.debug(`[Feature Flags] No existing flag found for "${name}" at scope "${scope}"${scopeId ? ` with scope_id "${scopeId}"` : ''}`);
  }

  const query = `
    INSERT INTO control_plane.feature_flags (name, enabled, scope, scope_id, metadata)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (name, scope, scope_id) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      updated_at = NOW(),
      metadata = EXCLUDED.metadata
  `;

  await pool.query(query, [name, enabled, scope, scopeId || null, JSON.stringify(metadata)]);

  // Invalidate cache for this flag
  invalidateFlagCache(name);

  return oldValue;
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

  let query = 'SELECT name, enabled, scope, scope_id, metadata FROM control_plane.feature_flags';
  const params: (string | number)[] = [];

  const conditions: string[] = [];
  if (scope) {
    conditions.push('scope = $1');
    params.push(scope);
  }
  if (scopeId) {
    const paramIndex = params.length + 1;
    conditions.push(`scope_id = $${paramIndex}`);
    params.push(scopeId);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY name';

  const result = await pool.query<FeatureFlagRow>(query, params);
  return result.rows;
}

/**
 * Get feature flags for a specific project
 * Returns both project-specific flags and global flags
 *
 * @param projectId - The project ID to get flags for
 * @returns Array of feature flags with project flags overriding global flags
 */
export async function getProjectFeatureFlags(projectId: string): Promise<FeatureFlagRow[]> {
  const pool = getPool();

  const query = `
    WITH all_flags AS (
      SELECT
        name,
        enabled,
        scope,
        scope_id,
        metadata,
        ROW_NUMBER() OVER (
          PARTITION BY name
          ORDER BY
            CASE
              WHEN scope = 'project' AND scope_id = $1 THEN 1
              WHEN scope = 'global' THEN 2
              ELSE 3
            END
        ) as rn
      FROM control_plane.feature_flags
      WHERE scope = 'global' OR (scope = 'project' AND scope_id = $1)
    )
    SELECT name, enabled, scope, scope_id, metadata
    FROM all_flags
    WHERE rn = 1
    ORDER BY name
  `;

  const result = await pool.query<FeatureFlagRow>(query, [projectId]);
  return result.rows;
}

/**
 * Delete a feature flag for a specific scope
 *
 * @param name - The feature flag name
 * @param scope - The scope of the flag
 * @param scopeId - The ID of the project or org (required for non-global scopes)
 * @returns true if the flag was deleted, false if it didn't exist
 */
export async function deleteFeatureFlag(
  name: string,
  scope: FeatureFlagScope = 'global',
  scopeId?: string
): Promise<boolean> {
  const pool = getPool();

  let query = 'DELETE FROM control_plane.feature_flags WHERE name = $1 AND scope = $2';
  const params: (string | null)[] = [name, scope];

  if (scopeId) {
    query += ' AND scope_id = $3';
    params.push(scopeId);
  }

  const result = await pool.query(query, params);

  // Invalidate cache for this flag
  invalidateFlagCache(name);

  return (result.rowCount ?? 0) > 0;
}
