/**
 * Manual Overrides Database Writes Module
 *
 * Provides write database operations for manual overrides.
 * Handles creating override records.
 */

import { getPool } from '@/lib/db'
import {
  ManualOverrideAction,
  OverrideRecord,
  ProjectStatus,
  HardCapType,
} from '../../types'

/**
 * Create override record in database
 *
 * @param data - Override record data
 * @returns Created override record
 */
export async function createOverrideRecord(data: {
  projectId: string
  action: ManualOverrideAction
  reason: string
  notes?: string
  previousCaps: Record<HardCapType, number>
  newCaps?: Record<HardCapType, number>
  performedBy: string
  ipAddress?: string
  previousStatus: ProjectStatus
  newStatus: ProjectStatus
}): Promise<OverrideRecord> {
  const pool = getPool()

  const insertResult = await pool.query(
    `
    INSERT INTO manual_overrides (
      project_id,
      action,
      reason,
      notes,
      previous_caps,
      new_caps,
      performed_by,
      ip_address,
      previous_status,
      new_status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, project_id, action, reason, notes, previous_caps, new_caps,
              performed_by, performed_at, ip_address, previous_status, new_status
    `,
    [
      data.projectId,
      data.action,
      data.reason,
      data.notes || null,
      JSON.stringify(data.previousCaps),
      data.newCaps ? JSON.stringify(data.newCaps) : null,
      data.performedBy,
      data.ipAddress || null,
      data.previousStatus,
      data.newStatus,
    ]
  )

  const row = insertResult.rows[0]

  return {
    id: row.id,
    project_id: row.project_id,
    action: row.action as ManualOverrideAction,
    reason: row.reason,
    notes: row.notes || undefined,
    previous_caps: data.previousCaps,
    new_caps: data.newCaps,
    performed_by: row.performed_by,
    performed_at: row.performed_at,
    ip_address: row.ip_address || undefined,
    previous_status: row.previous_status as ProjectStatus,
    new_status: row.new_status as ProjectStatus,
  }
}
