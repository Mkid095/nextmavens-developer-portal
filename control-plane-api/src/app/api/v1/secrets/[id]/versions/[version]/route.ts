/**
 * Secrets API - Get Specific Secret Version
 * PRD: US-009 from prd-secrets-versioning.json
 *
 * GET /api/v1/secrets/:id/versions/:version - Get specific version of a secret
 *
 * Note: This endpoint uses the secret ID from the URL, but retrieves the specific version
 * based on the version number. This allows access to any version using a known secret ID.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { validateProjectOwnership } from '@/lib/tenant-middleware'
import { decryptFromStorage } from '@/lib/crypto'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

/**
 * GET /api/v1/secrets/:id/versions/:version - Get specific version of a secret
 *
 * URL parameters:
 * - id: UUID of any version of the secret (used to identify the secret)
 * - version: Version number to retrieve
 *
 * Response:
 * - success: true
 * - data: Secret version object with decrypted value
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; version: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const secretId = params.id
    const versionParam = params.version
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

    // Validate version parameter
    const version = parseInt(versionParam, 10)
    if (isNaN(version) || version < 1) {
      return errorResponse('VALIDATION_ERROR', 'Invalid version number', 400)
    }

    // Get the secret by ID to find project_id and name
    const secretRefResult = await pool.query(
      `SELECT project_id, name FROM control_plane.secrets WHERE id = $1`,
      [secretId]
    )

    if (secretRefResult.rows.length === 0) {
      return errorResponse('SECRET_NOT_FOUND', 'Secret not found', 404)
    }

    const secretRef = secretRefResult.rows[0]

    // Validate project ownership
    const ownershipCheck = await validateProjectOwnership(
      secretRef.project_id,
      developer
    )
    if (!ownershipCheck.valid) {
      const error = ownershipCheck.error === 'NOT_FOUND'
        ? 'Project not found'
        : 'You do not have access to this project'
      return errorResponse(ownershipCheck.error || 'FORBIDDEN', error, 403)
    }

    // Get the specific version
    const result = await pool.query(
      `SELECT
        s.id, s.name, s.value_encrypted, s.version, s.active,
        s.rotated_from, s.rotation_reason, s.created_at,
        s.created_by, s.grace_period_ends_at, s.grace_period_warning_sent_at
       FROM control_plane.secrets s
       WHERE s.project_id = $1 AND s.name = $2 AND s.version = $3`,
      [secretRef.project_id, secretRef.name, version]
    )

    if (result.rows.length === 0) {
      return errorResponse(
        'VERSION_NOT_FOUND',
        `Version ${version} not found for secret '${secretRef.name}'`,
        404
      )
    }

    const secret = result.rows[0]

    // Decrypt the value
    let value: string
    try {
      value = decryptFromStorage(secret.value_encrypted)
    } catch (error) {
      console.error('[Secrets API] Decryption error:', error)
      return errorResponse(
        'DECRYPTION_ERROR',
        'Failed to decrypt secret value',
        500
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: secret.id,
        name: secret.name,
        value,
        version: secret.version,
        active: secret.active,
        rotated_from: secret.rotated_from,
        rotation_reason: secret.rotation_reason,
        created_at: secret.created_at,
        created_by: secret.created_by,
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
    console.error('[Secrets API] Get secret version error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to get secret version', 500)
  }
}
