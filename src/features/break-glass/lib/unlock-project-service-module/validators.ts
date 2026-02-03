/**
 * Unlock Project Service - Module - Validators
 */

import { VALIDATION_ERRORS } from '../constants'
import type { UnlockProjectParams } from '../types'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors?: ValidationError[]
}

export function validateUnlockRequest(
  params: Partial<UnlockProjectParams>
): ValidationResult {
  const errors: ValidationError[] = []

  if (!params.projectId || typeof params.projectId !== 'string') {
    errors.push({ field: 'projectId', message: VALIDATION_ERRORS.PROJECT_ID_REQUIRED })
  }

  if (!params.sessionId || typeof params.sessionId !== 'string') {
    errors.push({ field: 'sessionId', message: VALIDATION_ERRORS.SESSION_ID_REQUIRED })
  }

  if (!params.adminId || typeof params.adminId !== 'string') {
    errors.push({ field: 'adminId', message: VALIDATION_ERRORS.ADMIN_ID_REQUIRED })
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

export async function validateProjectExists(pool: any, projectId: string): Promise<void> {
  const project = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId])

  if (project.rows.length === 0) {
    const error = {
      error: 'Project not found',
      details: `Project with ID ${projectId} does not exist`,
      code: 'PROJECT_NOT_FOUND',
    }
    throw new Error(JSON.stringify(error))
  }
}
