/**
 * Force Delete Project Service - Validation
 *
 * US-006: Implement Force Delete Power - Step 1: Foundation
 */

import type { ForceDeleteProjectParams, ValidationResult } from './types'

/**
 * Validate force delete request parameters
 *
 * @param params - Parameters to validate
 * @returns Validation result with any errors
 *
 * @example
 * ```typescript
 * const validation = validateForceDeleteRequest({
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
export function validateForceDeleteRequest(
  params: Partial<ForceDeleteProjectParams>
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
