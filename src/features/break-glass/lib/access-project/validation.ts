/**
 * Access Project Service - Validation
 *
 * US-008: Implement Access Any Project Power
 */

import type { AccessProjectParams, ValidationResult } from './types'

/**
 * Validate access request parameters
 *
 * @param params - Parameters to validate
 * @returns Validation result with any errors
 *
 * @example
 * ```typescript
 * const validation = validateAccessRequest({
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
export function validateAccessRequest(
  params: Partial<AccessProjectParams>
): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  if (!params.projectId || typeof params.projectId !== 'string') {
    errors.push({ field: 'projectId', message: 'Project ID is required and must be a string' });
  }

  if (!params.sessionId || typeof params.sessionId !== 'string') {
    errors.push({ field: 'sessionId', message: 'Session ID is required and must be a string' });
  }

  if (!params.adminId || typeof params.adminId !== 'string') {
    errors.push({ field: 'adminId', message: 'Admin ID is required and must be a string' });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
