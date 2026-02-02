/**
 * Authentication Library - Project Status Checking
 *
 * US-007: Enforce Status Checks at Gateway
 */

import { getPool } from '@/lib/db'
import { createError, ErrorCode, projectSuspendedError, projectArchivedError, projectDeletedError } from '@/lib/errors'
import { ProjectStatus, getErrorCodeForStatus, keysWorkForStatus } from '@/lib/types/project-lifecycle.types'

/**
 * US-007: Enforce Status Checks at Gateway
 * Check project status and throw appropriate error if keys don't work for this status.
 *
 * @param projectId - The project ID to check
 * @throws PlatformError with PROJECT_SUSPENDED, PROJECT_ARCHIVED, or PROJECT_DELETED code
 */
export async function checkProjectStatus(projectId: string): Promise<void> {
  const pool = getPool()

  // Query project status from database
  const result = await pool.query(
    `SELECT status FROM projects WHERE id = $1`,
    [projectId]
  )

  if (result.rows.length === 0) {
    throw createError(ErrorCode.NOT_FOUND, 'Project not found', projectId)
  }

  const status = result.rows[0].status as ProjectStatus

  // Check if keys work for this status
  if (!keysWorkForStatus(status)) {
    // Get the appropriate error code for this status
    const errorCode = getErrorCodeForStatus(status)

    // Throw the appropriate error based on status
    switch (status) {
      case ProjectStatus.SUSPENDED:
        throw projectSuspendedError(
          'Project is suspended. API keys are disabled. Contact support for assistance.',
          projectId
        )
      case ProjectStatus.ARCHIVED:
        throw projectArchivedError(
          'Project is archived. API keys are disabled and services are stopped.',
          projectId
        )
      case ProjectStatus.DELETED:
        throw projectDeletedError(
          'Project has been deleted and pending permanent removal.',
          projectId
        )
      default:
        throw createError(
          ErrorCode.PROJECT_SUSPENDED,
          `Project is ${status}. API keys are disabled.`,
          projectId
        )
    }
  }
}
