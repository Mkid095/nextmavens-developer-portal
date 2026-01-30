/**
 * Secrets API - Rotate Secret
 * PRD: US-005 from prd-secrets-versioning.json
 *
 * POST /api/v1/secrets/:id/rotate - Rotate a secret to a new version
 *
 * Creates a new version of the secret with a new value, links it to the
 * previous version, and marks the previous version as inactive.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { validateProjectOwnership } from '@/lib/tenant-middleware'
import { encryptForStorage } from '@/lib/crypto'
import { z } from 'zod'

// Schema for rotating a secret
const rotateSecretSchema = z.object({
  value: z.string()
    .min(1, 'Secret value is required')
    .max(10000, 'Secret value must be less than 10,000 characters'),
  rotation_reason: z.string()
    .max(500, 'Rotation reason must be less than 500 characters')
    .optional(),
})

type RotateSecretInput = z.infer<typeof rotateSecretSchema>

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

/**
 * POST /api/v1/secrets/:id/rotate - Rotate a secret to a new version
 *
 * Path parameters:
 * - id: UUID of the secret to rotate
 *
 * Request body:
 * - value: New plain text secret value to encrypt
 * - rotation_reason: Optional reason for rotation (max 500 chars)
 *
 * Response:
 * - success: true
 * - data: New secret version object (without value)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const secretId = params.id
    const body = await req.json()

    // Validate secret ID format
    if (!secretId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(secretId)) {
      return errorResponse('INVALID_SECRET_ID', 'Invalid secret ID format', 400)
    }

    // Validate request body
    let validatedData: RotateSecretInput
    try {
      validatedData = rotateSecretSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(
          'VALIDATION_ERROR',
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    const { value, rotation_reason } = validatedData
    const pool = getPool()

    // Fetch the current active secret
    const currentSecretResult = await pool.query(
      `SELECT id, project_id, name, version, active
       FROM control_plane.secrets
       WHERE id = $1`,
      [secretId]
    )

    if (currentSecretResult.rows.length === 0) {
      return errorResponse('SECRET_NOT_FOUND', 'Secret not found', 404)
    }

    const currentSecret = currentSecretResult.rows[0]

    // Validate project ownership
    const ownershipCheck = await validateProjectOwnership(currentSecret.project_id, developer)
    if (!ownershipCheck.valid) {
      const error = ownershipCheck.error === 'NOT_FOUND'
        ? 'Project not found'
        : 'You do not have access to this project'
      return errorResponse(ownershipCheck.error || 'FORBIDDEN', error, 403)
    }

    // If the secret is not active, we can't rotate it (it's already been rotated)
    if (!currentSecret.active) {
      return errorResponse(
        'SECRET_NOT_ACTIVE',
        'This secret version is not active. Rotate the current active version instead.',
        409
      )
    }

    // Encrypt the new value
    let valueEncrypted: string
    try {
      valueEncrypted = encryptForStorage(value)
    } catch (error) {
      console.error('[Secrets API] Encryption error:', error)
      return errorResponse(
        'ENCRYPTION_ERROR',
        'Failed to encrypt secret value',
        500
      )
    }

    // Start a transaction for the rotation operation
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Create the new version with rotated_from link
      const newVersion = currentSecret.version + 1
      const newSecretResult = await client.query(
        `INSERT INTO control_plane.secrets
          (project_id, name, value_encrypted, version, active, rotated_from, rotation_reason, created_by)
         VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7)
         RETURNING id, project_id, name, version, active, rotated_from, rotation_reason, created_at`,
        [
          currentSecret.project_id,
          currentSecret.name,
          valueEncrypted,
          newVersion,
          currentSecret.id,
          rotation_reason || null,
          developer.id,
        ]
      )

      // Mark the old version as inactive and set grace period expiration
      // Grace period: 24 hours from rotation
      const gracePeriodHours = 24
      await client.query(
        `UPDATE control_plane.secrets
         SET active = FALSE,
             expires_at = NOW() + INTERVAL '${gracePeriodHours} hours'
         WHERE id = $1`,
        [currentSecret.id]
      )

      await client.query('COMMIT')

      const newSecret = newSecretResult.rows[0]

      // Get the updated old secret with expires_at for the response
      const oldSecretWithExpiration = await client.query(
        `SELECT id, expires_at FROM control_plane.secrets WHERE id = $1`,
        [currentSecret.id]
      )

      return NextResponse.json({
        success: true,
        data: {
          id: newSecret.id,
          project_id: newSecret.project_id,
          name: newSecret.name,
          version: newSecret.version,
          active: newSecret.active,
          rotated_from: newSecret.rotated_from,
          rotation_reason: newSecret.rotation_reason,
          created_at: newSecret.created_at,
          // Include grace period info for old version
          oldSecret: {
            id: currentSecret.id,
            expiresAt: oldSecretWithExpiration.rows[0]?.expires_at,
          },
          gracePeriodHours: 24,
        },
      }, { status: 201 })

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
    console.error('[Secrets API] Rotate secret error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to rotate secret', 500)
  }
}
