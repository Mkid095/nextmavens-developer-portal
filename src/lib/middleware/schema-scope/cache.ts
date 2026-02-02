/**
 * Schema Scope Middleware - Cache
 *
 * Cache for tenant slug lookups.
 */

import { getPool } from '@/lib/db'
import { SchemaScopeError } from './types'
import type { CacheEntry } from './types'
import { CACHE_TTL } from './types'

/**
 * Cache for tenant slug lookups
 * Maps project_id -> CacheEntry
 */
const tenantSlugCache = new Map<string, CacheEntry>()

/**
 * Get tenant slug for a project
 * Uses cache to avoid repeated database queries
 *
 * @param projectId - The project ID
 * @returns The tenant slug
 * @throws Error if tenant not found
 */
export async function getTenantSlug(projectId: string): Promise<string> {
  // Check cache first
  const cached = tenantSlugCache.get(projectId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.slug
  }

  // Query database for tenant slug
  // Use base pool to avoid recursive scoping - query control_plane schema
  const pool = getPool()
  const result = await pool.query(
    `SELECT t.slug as tenant_slug
     FROM control_plane.projects p
     JOIN control_plane.tenants t ON p.tenant_id = t.id
     WHERE p.id = $1`,
    [projectId]
  )

  if (result.rows.length === 0) {
    throw new Error(SchemaScopeError.TENANT_NOT_FOUND)
  }

  const tenantSlug = result.rows[0].tenant_slug

  // Cache the result
  tenantSlugCache.set(projectId, {
    slug: tenantSlug,
    timestamp: Date.now(),
  })

  return tenantSlug
}

/**
 * Clear the tenant slug cache
 * Useful for testing or when tenant data changes
 */
export function clearTenantSlugCache(): void {
  tenantSlugCache.clear()
}
