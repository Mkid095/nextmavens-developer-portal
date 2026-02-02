/**
 * Override Suspension Validation
 */

import type { OverrideSuspensionParams, ValidationResult, ValidationError } from './types'

/**
 * Validate override suspension request parameters
 *
 * @param params - Parameters to validate
 * @returns Validation result with any errors
 *
 * @example
 * ```typescript
 * const validation = validateOverrideRequest({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 * });
 *
 * if (!validation.valid) {
 *   return NextResponse.json(
 *     { errors: validation.errors },
 *     { status: 400 }
 *   );
 * }
 * ```
 */
export function validateOverrideRequest(
  params: Partial<OverrideSuspensionParams>
): ValidationResult {
  const errors: ValidationError[] = []

  if (!params.projectId || typeof params.projectId !== 'string') {
    errors.push({
      field: 'projectId',
      message: 'Project ID is required and must be a string',
    })
  }

  if (!params.sessionId || typeof params.sessionId !== 'string') {
    errors.push({
      field: 'sessionId',
      message: 'Session ID is required and must be a string',
    })
  }

  if (!params.adminId || typeof params.adminId !== 'string') {
    errors.push({
      field: 'adminId',
      message: 'Admin ID is required and must be a string',
    })
  }

  // Validate new hard caps if provided
  if (params.newHardCaps && params.newHardCaps.length > 0) {
    for (const cap of params.newHardCaps) {
      if (!cap.type || typeof cap.type !== 'string') {
        errors.push({
          field: 'newHardCaps',
          message: 'Each hard cap must have a valid type',
        })
      }
      if (typeof cap.value !== 'number' || cap.value <= 0) {
        errors.push({
          field: 'newHardCaps',
          message: 'Each hard cap must have a positive numeric value',
        })
      }
    }
  }

  // Validate percentage increase if provided
  if (
    params.increaseCapsByPercent !== undefined &&
    (typeof params.increaseCapsByPercent !== 'number' ||
      params.increaseCapsByPercent <= 0)
  ) {
    errors.push({
      field: 'increaseCapsByPercent',
      message: 'Percentage increase must be a positive number',
    })
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}
