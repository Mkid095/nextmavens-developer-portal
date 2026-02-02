/**
 * Suspensions Module - Database Queries
 */

import { getPool } from '@/lib/db'
import type { SuspensionHistoryEntry, ProjectDetails } from './types'
import { SuspensionRecord, SuspensionReason, HardCapType, SuspensionType } from '../../types'

/**
 * Query project and organization details for notification
 */
export async function queryProjectDetails(
  projectId: string
): Promise<ProjectDetails | null> {
  const pool = getPool()
  const result = await pool.query(
    `
    SELECT p.project_name, o.name as org_name
    FROM projects p
    JOIN organizations o ON p.org_id = o.id
    WHERE p.id = $1
    `,
    [projectId]
  )

  if (result.rows.length === 0) {
    return null
  }

  return {
    projectName: result.rows[0].project_name || 'Unknown Project',
    orgName: result.rows[0].org_name || 'Unknown Organization',
  }
}

/**
 * Check if project has an active suspension
 */
export async function queryExistingSuspension(
  projectId: string
): Promise<boolean> {
  const pool = getPool()
  const result = await pool.query(
    `
    SELECT id FROM suspensions
    WHERE project_id = $1 AND resolved_at IS NULL
    `,
    [projectId]
  )

  return result.rows.length > 0
}

/**
 * Insert suspension record
 */
export async function insertSuspensionRecord(
  projectId: string,
  reason: SuspensionReason,
  notes: string | null,
  suspensionType: SuspensionType
): Promise<void> {
  const pool = getPool()
  await pool.query(
    `
    INSERT INTO suspensions (project_id, reason, cap_exceeded, notes, suspension_type)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [projectId, JSON.stringify(reason), reason.cap_type, notes, suspensionType]
  )
}

/**
 * Insert suspension history entry
 */
export async function insertSuspensionHistory(
  projectId: string,
  action: string,
  reason: SuspensionReason | string,
  notes: string | null
): Promise<void> {
  const pool = getPool()
  await pool.query(
    `
    INSERT INTO suspension_history (project_id, action, reason, notes)
    VALUES ($1, $2, $3, $4)
    `,
    [projectId, typeof reason === 'string' ? reason : JSON.stringify(reason), notes]
  )
}

/**
 * Update project status
 */
export async function updateProjectStatus(
  projectId: string,
  status: 'active' | 'suspended'
): Promise<void> {
  const pool = getPool()
  await pool.query(
    `
    UPDATE projects
    SET status = $1
    WHERE id = $2
    `,
    [status, projectId]
  )
}

/**
 * Get active suspension for a project
 */
export async function queryActiveSuspension(
  projectId: string
): Promise<{ id: string; reason: string; cap_exceeded: string } | null> {
  const pool = getPool()
  const result = await pool.query(
    `
    SELECT id, reason, cap_exceeded
    FROM suspensions
    WHERE project_id = $1 AND resolved_at IS NULL
    `,
    [projectId]
  )

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0]
}

/**
 * Mark suspension as resolved
 */
export async function resolveSuspension(projectId: string): Promise<void> {
  const pool = getPool()
  await pool.query(
    `
    UPDATE suspensions
    SET resolved_at = NOW()
    WHERE project_id = $1 AND resolved_at IS NULL
    `,
    [projectId]
  )
}

/**
 * Get suspension status for a project
 */
export async function querySuspensionStatus(
  projectId: string
): Promise<SuspensionRecord | null> {
  const pool = getPool()
  const result = await pool.query(
    `
    SELECT
      id,
      project_id,
      reason,
      cap_exceeded,
      suspended_at,
      resolved_at,
      notes,
      suspension_type
    FROM suspensions
    WHERE project_id = $1 AND resolved_at IS NULL
    `,
    [projectId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]

  return {
    id: row.id,
    project_id: row.project_id,
    reason: row.reason as SuspensionReason,
    cap_exceeded: row.cap_exceeded as HardCapType,
    suspended_at: row.suspended_at,
    resolved_at: row.resolved_at,
    notes: row.notes,
    suspension_type: row.suspension_type as SuspensionType,
  }
}

/**
 * Get all active projects with environment
 */
export async function queryActiveProjects(): Promise<Array<{ id: string; project_name: string; environment: string }>> {
  const pool = getPool()
  const result = await pool.query(
    `
    SELECT id, project_name, environment
    FROM projects
    WHERE status = 'active'
    `
  )

  return result.rows
}

/**
 * Get all active suspensions with project names
 */
export async function queryAllActiveSuspensions(): Promise<SuspensionRecord[]> {
  const pool = getPool()
  const result = await pool.query(
    `
    SELECT
      s.id,
      s.project_id,
      s.reason,
      s.cap_exceeded,
      s.suspended_at,
      s.resolved_at,
      s.notes,
      s.suspension_type,
      p.project_name
    FROM suspensions s
    JOIN projects p ON s.project_id = p.id
    WHERE s.resolved_at IS NULL
    ORDER BY s.suspended_at DESC
    `
  )

  return result.rows.map((row) => ({
    id: row.id,
    project_id: row.project_id,
    reason: row.reason as SuspensionReason,
    cap_exceeded: row.cap_exceeded as HardCapType,
    suspended_at: row.suspended_at,
    resolved_at: row.resolved_at,
    notes: row.notes,
    suspension_type: row.suspension_type as SuspensionType,
  }))
}

/**
 * Get suspension history for a project
 */
export async function querySuspensionHistory(
  projectId: string
): Promise<SuspensionHistoryEntry[]> {
  const pool = getPool()
  const result = await pool.query(
    `
    SELECT
      action,
      occurred_at,
      reason
    FROM suspension_history
    WHERE project_id = $1
    ORDER BY occurred_at DESC
    `,
    [projectId]
  )

  return result.rows.map((row) => ({
    action: row.action,
    occurred_at: row.occurred_at,
    reason: row.reason as SuspensionReason,
  }))
}
