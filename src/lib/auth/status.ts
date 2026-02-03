/**
 * Project Status Checking
 */

import { getPool } from '@/lib/db'
import {
  createError,
  ErrorCode,
  projectSuspendedError,
  projectArchivedError,
  projectDeletedError,
} from '../errors'
import { ProjectStatus, getErrorCodeForStatus, keysWorkForStatus } from '../types/project-lifecycle.types'

export async function checkProjectStatus(projectId: string): Promise<void> {
  const pool = getPool()

  const result = await pool.query(
    `SELECT status FROM projects WHERE id = $1`,
    [projectId]
  )

  if (result.rows.length === 0) {
    throw createError(ErrorCode.NOT_FOUND, 'Project not found', projectId)
  }

  const status = result.rows[0].status as ProjectStatus

  if (!keysWorkForStatus(status)) {
    const errorCode = getErrorCodeForStatus(status)

    switch (status) {
      case ProjectStatus.SUSPENDED:
        throw projectSuspendedError(
          'Project is suspended. API keys are disabled. Contact support for assistance.',
          projectId
        )
      case ProjectStatus.ARCHIVED:
        throw projectArchivedError(
          'Project is archived. API keys are disabled. Contact support for assistance.',
          projectId
        )
      case ProjectStatus.DELETED:
        throw projectDeletedError(
          'Project is deleted. API keys are disabled. Contact support for assistance.',
          projectId
        )
      default:
        // This should never be reached since all ProjectStatus values are handled above
        throw createError(ErrorCode.NOT_FOUND, 'Project is not in an active state', projectId)
    }
  }
}
