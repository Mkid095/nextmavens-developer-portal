/**
 * Secrets API - Get Secret Details and Delete Secret
 * PRD: US-009 (GET) and US-008 (DELETE) from prd-secrets-versioning.json
 *
 * GET /api/v1/secrets/:id - Get secret details (decrypt value)
 * DELETE /api/v1/secrets/:id - Soft delete a secret
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { validateProjectOwnership } from '@/lib/tenant-middleware'
import { decryptFromStorage } from '@/lib/crypto'
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
 * GET /api/v1/secrets/:id - Get secret details (decrypt value)
 *
 * URL parameters:
 * - id: UUID of the secret
 *
 * Response:
 * - success: true
 * - data: Secret object with decrypted value
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

    // Get secret details (excluding soft-deleted secrets)
    const result = await pool.query(
      `SELECT
        s.id, s.project_id, s.name, s.value_encrypted, s.version, s.active,
        s.rotated_from, s.rotation_reason, s.created_at,
        s.created_by, s.grace_period_ends_at, s.grace_period_warning_sent_at,
        p.name as project_name
       FROM control_plane.secrets s
       JOIN control_plane.projects p ON s.project_id = p.id
       WHERE s.id = $1 AND s.deleted_at IS NULL`,
      [secretId]
    )

    if (result.rows.length === 0) {
      return errorResponse('SECRET_NOT_FOUND', 'Secret not found', 404)
    }

    const secret = result.rows[0]

    // Validate project ownership
    const ownershipCheck = await validateProjectOwnership(secret.project_id, developer)
    if (!ownershipCheck.valid) {
      const error = ownershipCheck.error === 'NOT_FOUND'
        ? 'Project not found'
        : 'You do not have access to this project'
      return errorResponse(ownershipCheck.error || 'FORBIDDEN', error, 403)
    }

    // Decrypt the value
    let value: string
    try {
      value = decryptFromStorage(secret.value_encrypted)
    } catch (error) {
      secureError('Decryption error', { error: String(error), secretId })
      return errorResponse(
        'DECRYPTION_ERROR',
        'Failed to decrypt secret value',
        500
      )
    }

    // Log secret access to audit logs (US-012: Secret Access Logging)
    try {
      await logSecretAccess(developer.id, secretId, secret.project_id, {
        version: secret.version,
        action: 'accessed',
        secretName: secret.name,
      })
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      secureError('Failed to log secret access audit', { error: String(auditError) })
    }

    // Log secret access without value (US-011: Prevent Secret Logging)
    secureLog('Secret accessed', {
      secretId,
      secretName: secret.name,
      projectId: secret.project_id,
      accessedBy: developer.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: secret.id,
        project_id: secret.project_id,
        project_name: secret.project_name,
        name: secret.name,
        value,
        version: secret.version,
        active: secret.active,
        rotated_from: secret.rotated_from,
        rotation_reason: secret.rotation_reason,
        created_at: secret.created_at,
        grace_period_ends_at: secret.grace_period_ends_at,
        grace_period_warning_sent_at: secret.grace_period_warning_sent_at,
      },
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    secureError('Get secret error', { error: String(error), secretId: params.id })
    return errorResponse('INTERNAL_ERROR', 'Failed to get secret', 500)
  }
}

/**
 * DELETE /api/v1/secrets/:id - Soft delete a secret
 *
 * PRD: US-008 from prd-secrets-versioning.json
 *
 * URL parameters:
 * - id: UUID of the secret to delete
 *
 * Behavior:
 * - Sets deleted_at timestamp (soft delete)
 * - All versions of the secret are marked as deleted
 * - Hard delete occurs 30 days after deletion
 * - Consumers are notified of deletion (US-007 - to be implemented)
 *
 * Response:
 * - success: true
 * - data: { deletedAt, versionsDeleted, hardDeleteScheduledAt }
 */
export async function DELETE(
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

    // Get the secret to find project_id and name (only if not already deleted)
    const secretResult = await pool.query(
      `SELECT id, project_id, name, version FROM control_plane.secrets
       WHERE id = $1 AND deleted_at IS NULL`,
      [secretId]
    )

    if (secretResult.rows.length === 0) {
      return errorResponse('SECRET_NOT_FOUND', 'Secret not found or already deleted', 404)
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

    // Get all versions of this secret (by project_id and name)
    const allVersionsResult = await pool.query(
      `SELECT id, version FROM control_plane.secrets
       WHERE project_id = $1 AND name = $2 AND deleted_at IS NULL
       ORDER BY version DESC`,
      [secret.project_id, secret.name]
    )

    const allVersions = allVersionsResult.rows

    // Start a transaction for soft delete
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Soft delete all versions of this secret by setting deleted_at
      const hardDeleteDays = 30
      const result = await client.query(
        `UPDATE control_plane.secrets
         SET deleted_at = NOW()
         WHERE project_id = $1 AND name = $2 AND deleted_at IS NULL
         RETURNING id, version`,
        [secret.project_id, secret.name]
      )

      await client.query('COMMIT')

      const deletedVersions = result.rows
      const hardDeleteScheduledAt = new Date()
      hardDeleteScheduledAt.setDate(hardDeleteScheduledAt.getDate() + hardDeleteDays)

      // Log secret deletion without value (US-011: Prevent Secret Logging)
      secureLog('Secret deleted (soft delete)', {
        secretId,
        secretName: secret.name,
        projectId: secret.project_id,
        deletedBy: developer.id,
        versionsDeleted: deletedVersions.length,
        hardDeleteScheduledAt: hardDeleteScheduledAt.toISOString(),
      })

      // Note: Consumer notification (US-007) to be implemented when webhooks are ready

      return NextResponse.json({
        success: true,
        data: {
          deleted: true,
          secretName: secret.name,
          versionsDeleted: deletedVersions.length,
          deletedAt: new Date().toISOString(),
          hardDeleteScheduledAt: hardDeleteScheduledAt.toISOString(),
          hardDeleteAfterDays: hardDeleteDays,
        },
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    secureError('Delete secret error', { error: String(error), secretId: params.id })
    return errorResponse('INTERNAL_ERROR', 'Failed to delete secret', 500)
  }
}
