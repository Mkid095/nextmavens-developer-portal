import { getPool } from '@/lib/db'
import { HardCapType, ProjectQuota, HardCapConfig, DEFAULT_HARD_CAPS } from '../types'

/**
 * Get all quotas for a project
 */
export async function getProjectQuotas(projectId: string): Promise<ProjectQuota[]> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT id, project_id, cap_type, cap_value, created_at, updated_at
      FROM project_quotas
      WHERE project_id = $1
      ORDER BY cap_type
      `,
      [projectId]
    )

    return result.rows
  } catch (error) {
    console.error('[Quotas] Error fetching project quotas:', error)
    throw new Error('Failed to fetch project quotas')
  }
}

/**
 * Get a specific quota for a project
 */
export async function getProjectQuota(
  projectId: string,
  capType: HardCapType
): Promise<ProjectQuota | null> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT id, project_id, cap_type, cap_value, created_at, updated_at
      FROM project_quotas
      WHERE project_id = $1 AND cap_type = $2
      `,
      [projectId, capType]
    )

    return result.rows[0] || null
  } catch (error) {
    console.error('[Quotas] Error fetching project quota:', error)
    throw new Error('Failed to fetch project quota')
  }
}

/**
 * Set or update a quota for a project
 */
export async function setProjectQuota(
  projectId: string,
  capType: HardCapType,
  capValue: number
): Promise<ProjectQuota> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      INSERT INTO project_quotas (project_id, cap_type, cap_value)
      VALUES ($1, $2, $3)
      ON CONFLICT (project_id, cap_type)
      DO UPDATE SET
        cap_value = EXCLUDED.cap_value,
        updated_at = NOW()
      RETURNING id, project_id, cap_type, cap_value, created_at, updated_at
      `,
      [projectId, capType, capValue]
    )

    return result.rows[0]
  } catch (error) {
    console.error('[Quotas] Error setting project quota:', error)
    throw new Error('Failed to set project quota')
  }
}

/**
 * Set multiple quotas for a project
 */
export async function setProjectQuotas(
  projectId: string,
  quotas: HardCapConfig[]
): Promise<ProjectQuota[]> {
  const results: ProjectQuota[] = []

  for (const quota of quotas) {
    const result = await setProjectQuota(projectId, quota.type, quota.value)
    results.push(result)
  }

  return results
}

/**
 * Apply default quotas to a project
 */
export async function applyDefaultQuotas(projectId: string): Promise<ProjectQuota[]> {
  const defaultQuotas: HardCapConfig[] = Object.entries(DEFAULT_HARD_CAPS).map(
    ([type, value]) => ({
      type: type as HardCapType,
      value,
    })
  )

  return setProjectQuotas(projectId, defaultQuotas)
}

/**
 * Check if a project has quotas configured
 */
export async function hasQuotasConfigured(projectId: string): Promise<boolean> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM project_quotas
      WHERE project_id = $1
      `,
      [projectId]
    )

    return parseInt(result.rows[0].count) > 0
  } catch (error) {
    console.error('[Quotas] Error checking quotas configured:', error)
    throw new Error('Failed to check quotas configured')
  }
}

/**
 * Delete a quota for a project (resets to default)
 */
export async function deleteProjectQuota(
  projectId: string,
  capType: HardCapType
): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `
      DELETE FROM project_quotas
      WHERE project_id = $1 AND cap_type = $2
      `,
      [projectId, capType]
    )
  } catch (error) {
    console.error('[Quotas] Error deleting project quota:', error)
    throw new Error('Failed to delete project quota')
  }
}

/**
 * Reset all quotas for a project to defaults
 */
export async function resetProjectQuotas(projectId: string): Promise<ProjectQuota[]> {
  const pool = getPool()

  try {
    // Delete existing quotas
    await pool.query(
      `
      DELETE FROM project_quotas
      WHERE project_id = $1
      `,
      [projectId]
    )

    // Apply defaults
    return applyDefaultQuotas(projectId)
  } catch (error) {
    console.error('[Quotas] Error resetting project quotas:', error)
    throw new Error('Failed to reset project quotas')
  }
}

/**
 * Get all projects exceeding a specific quota type
 */
export async function getProjectsExceedingQuota(
  capType: HardCapType,
  currentUsageCallback: (projectId: string) => Promise<number>
): Promise<Array<{ projectId: string; current: number; limit: number }>> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `
      SELECT project_id, cap_value
      FROM project_quotas
      WHERE cap_type = $1
      `,
      [capType]
    )

    const exceedingProjects: Array<{ projectId: string; current: number; limit: number }> = []

    for (const row of result.rows) {
      const currentUsage = await currentUsageCallback(row.project_id)
      if (currentUsage > row.cap_value) {
        exceedingProjects.push({
          projectId: row.project_id,
          current: currentUsage,
          limit: row.cap_value,
        })
      }
    }

    return exceedingProjects
  } catch (error) {
    console.error('[Quotas] Error getting projects exceeding quota:', error)
    throw new Error('Failed to get projects exceeding quota')
  }
}

/**
 * Get quota statistics for a project
 */
export async function getProjectQuotaStats(projectId: string): Promise<{
  configured: boolean
  quotas: Array<{ type: string; value: number; isDefault: boolean }>
}> {
  const pool = getPool()

  try {
    const quotas = await getProjectQuotas(projectId)

    return {
      configured: quotas.length > 0,
      quotas: quotas.map((quota) => ({
        type: quota.cap_type,
        value: quota.cap_value,
        isDefault: quota.cap_value === DEFAULT_HARD_CAPS[quota.cap_type as HardCapType],
      })),
    }
  } catch (error) {
    console.error('[Quotas] Error getting project quota stats:', error)
    throw new Error('Failed to get project quota stats')
  }
}
