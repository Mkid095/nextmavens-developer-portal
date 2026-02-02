/**
 * Feature Flag Database Operations
 */

import { getPool } from '../db'
import type { FeatureFlagScope } from './types'
import type { FeatureFlagRow } from './types'
import { invalidateFlagCache } from './cache'

async function fetchFlag(name: string, scope: FeatureFlagScope, scopeId?: string): Promise<boolean> {
  const pool = getPool()

  let query = ''
  let params: (string | number)[] = []

  if (scope === 'global') {
    query = `SELECT enabled, scope FROM control_plane.feature_flags WHERE name = $1 AND scope = 'global'`
    params = [name]
  } else if (scopeId) {
    query = `
      SELECT enabled, scope FROM control_plane.feature_flags
      WHERE name = $1 AND (scope = $2 AND scope_id = $3) OR (scope = 'global')
      ORDER BY CASE WHEN scope = $2 AND scope_id = $3 THEN 1 WHEN scope = 'global' THEN 2 ELSE 3 END LIMIT 1
    `
    params = [name, scope, scopeId]
  } else {
    query = `SELECT enabled, scope FROM control_plane.feature_flags WHERE name = $1 AND scope = 'global'`
    params = [name]
  }

  try {
    const result = await pool.query<FeatureFlagRow>(query, params)

    if (result.rows.length === 0) {
      return true // Default to enabled
    }

    return result.rows[0].enabled
  } catch (error) {
    console.error(`Error fetching feature flag "${name}":`, error)
    return true // Default to enabled on error
  }
}

export async function checkFeature(
  name: string,
  scope: FeatureFlagScope = 'global',
  scopeId?: string
): Promise<boolean> {
  const { getCachedValue, setCachedValue } = require('./cache')
  const cached = getCachedValue(name, scope, scopeId)
  if (cached !== null) {
    return cached
  }

  const enabled = await fetchFlag(name, scope, scopeId)
  setCachedValue(name, scope, enabled, scopeId)
  return enabled
}

export function checkFeatureSync(
  name: string,
  scope: FeatureFlagScope = 'global',
  scopeId?: string
): boolean | null {
  const { getCachedValue } = require('./cache')
  return getCachedValue(name, scope, scopeId)
}

export async function setFeatureFlag(
  name: string,
  enabled: boolean,
  scope: FeatureFlagScope = 'global',
  scopeId?: string,
  metadata: Record<string, unknown> = {}
): Promise<boolean | null> {
  const pool = getPool()

  // Get old value
  const selectQuery = `
    SELECT enabled FROM control_plane.feature_flags
    WHERE name = $1 AND scope = $2 ${scopeId ? 'AND scope_id = $3' : ''}
  `
  let oldValue: boolean | null = null
  try {
    const selectResult = await pool.query<{ enabled: boolean }>(
      selectQuery,
      scopeId ? [name, scope, scopeId] : [name, scope]
    )
    if (selectResult.rows.length > 0) {
      oldValue = selectResult.rows[0].enabled
    }
  } catch (error) {
    console.debug(`[Feature Flags] No existing flag found for "${name}" at scope "${scope}"`)
  }

  const query = `
    INSERT INTO control_plane.feature_flags (name, enabled, scope, scope_id, metadata)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (name, scope, scope_id) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      updated_at = NOW(),
      metadata = EXCLUDED.metadata
  `

  await pool.query(query, [name, enabled, scope, scopeId || null, JSON.stringify(metadata)])

  invalidateFlagCache(name)

  return oldValue
}

export async function getFeatureFlags(
  scope?: FeatureFlagScope,
  scopeId?: string
): Promise<FeatureFlagRow[]> {
  const pool = getPool()

  let query = 'SELECT name, enabled, scope, scope_id, metadata FROM control_plane.feature_flags'
  const params: (string | number)[] = []

  const conditions: string[] = []
  if (scope) {
    conditions.push('scope = $1')
    params.push(scope)
  }
  if (scopeId) {
    const paramIndex = params.length + 1
    conditions.push(`scope_id = $${paramIndex}`)
    params.push(scopeId)
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }

  query += ' ORDER BY name'

  const result = await pool.query<FeatureFlagRow>(query, params)
  return result.rows
}

export async function getProjectFeatureFlags(projectId: string): Promise<FeatureFlagRow[]> {
  const pool = getPool()

  const query = `
    WITH all_flags AS (
      SELECT name, enabled, scope, scope_id, metadata,
        ROW_NUMBER() OVER (
          PARTITION BY name
          ORDER BY CASE WHEN scope = 'project' AND scope_id = $1 THEN 1 WHEN scope = 'global' THEN 2 ELSE 3 END
        ) as rn
      FROM control_plane.feature_flags
      WHERE scope = 'global' OR (scope = 'project' AND scope_id = $1)
    )
    SELECT name, enabled, scope, scope_id, metadata
    FROM all_flags
    WHERE rn = 1
    ORDER BY name
  `

  const result = await pool.query<FeatureFlagRow>(query, [projectId])
  return result.rows
}

export async function deleteFeatureFlag(
  name: string,
  scope: FeatureFlagScope = 'global',
  scopeId?: string
): Promise<boolean> {
  const pool = getPool()

  let query = 'DELETE FROM control_plane.feature_flags WHERE name = $1 AND scope = $2'
  const params: (string | null)[] = [name, scope]

  if (scopeId) {
    query += ' AND scope_id = $3'
    params.push(scopeId)
  }

  const result = await pool.query(query, params)
  invalidateFlagCache(name)

  return (result.rowCount ?? 0) > 0
}
