/**
 * Secrets API - List Secret Versions
 * PRD: US-009 from prd-secrets-versioning.json
 *
 * GET /api/v1/secrets/:id/versions - List all versions of a secret
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { validateProjectOwnership } from '@/lib/tenant-middleware'
import {
  secureLog,
  secureError,
  safeErrorResponse,
} from '@/lib/secure-logger'
import { logSecretAccess } from '@/lib/audit-logger'

// Helper function for standard error responses (using safe error response)
function errorResponse(code: string, message: string, status: number) {
  return safeErrorResponse(code, message, status)
}

/**
 * GET /api/v1/secrets/:id/versions - List all versions of a secret
 *
 * URL parameters:
 * - id: UUID of the secret
 *
 * Response:
 * - success: true
 * - data: Array of secret versions (without values)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const secretId = params.id
    const pool = getPool()

    // Validate secret ID format
    if (
      !secretId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        secretId
      )
    ) {
      return errorResponse('VALIDATION_ERROR', 'Invalid secret ID format', 400)
    }

    // Get secret to find project_id
    const secretResult = await pool.query(
      `SELECT project_id, name FROM control_plane.secrets WHERE id = $1`,
      [secretId]
    )

    if (secretResult.rows.length === 0) {
      return errorResponse('SECRET_NOT_FOUND', 'Secret not found', 404)
    }

    const secret = secretResult.rows[0]

    // Validate project ownership
    const ownershipCheck = await validateProjectOwnership(secret.project_id, developer)
    if (!ownershipCheck.valid) {
      const error = ownershipCheck.error === 'NOT_FOUND'
        ? 'Project not found'
        : 'You do not have access to this project'
      return errorResponse(ownershipCheck.error || 'FORBIDDEN', error, 403)
    }

    // Get all versions of this secret (by name and project_id)
    const result = await pool.query(
      `SELECT
        s.id, s.name, s.version, s.active,
        s.rotated_from, s.rotation_reason, s.created_at,
        s.created_by, s.grace_period_ends_at, s.grace_period_warning_sent_at,
        s2.name as rotated_from_name
       FROM control_plane.secrets s
       LEFT JOIN control_plane.secrets s2 ON s.rotated_from = s2.id
       WHERE s.project_id = $1 AND s.name = (
         SELECT name FROM control_plane.secrets WHERE id = $2
       )
       ORDER BY s.version DESC`,
      [secret.project_id, secretId]
    )

    // Log secret versions list access to audit logs (US-012: Secret Access Logging)
    try {
      await logSecretAccess(developer.id, secretId, secret.project_id, {
        action: 'listed',
        secretName: secret.name,
      })
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      secureError('Failed to log secret versions list audit', { error: String(auditError) })
    }

    // Log secret versions list access without values (US-011: Prevent Secret Logging)
    secureLog('Secret versions listed', {
      secretId,
      secretName: secret.name,
      projectId: secret.project_id,
      versionCount: result.rows.length,
      accessedBy: developer.id,
    })

    return NextResponse.json({
      success: true,
      data: result.rows.map(s => ({
        id: s.id,
        name: s.name,
        version: s.version,
        active: s.active,
        rotated_from: s.rotated_from,
        rotated_from_name: s.rotated_from_name,
        rotation_reason: s.rotation_reason,
        created_at: s.created_at,
        created_by: s.created_by,
        grace_period_ends_at: s.grace_period_ends_at,
        grace_period_warning_sent_at: s.grace_period_warning_sent_at,
      })),
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    secureError('List secret versions error', { error: String(error), secretId })
    return errorResponse('INTERNAL_ERROR', 'Failed to list secret versions', 500)
  }
}
