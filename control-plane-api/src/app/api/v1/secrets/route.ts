/**
 * Secrets API - Create and List Secrets
 * PRD: US-004 from prd-secrets-versioning.json
 *
 * POST /api/v1/secrets - Create a new secret
 * GET /api/v1/secrets - List secrets (without values)
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { validateProjectOwnership } from '@/lib/tenant-middleware'
import { encryptForStorage } from '@/lib/crypto'

// Validation schemas using Zod
import { z } from 'zod'

// Schema for creating a secret
const createSecretSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  name: z.string()
    .min(1, 'Secret name is required')
    .max(255, 'Secret name must be less than 255 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Secret name can only contain letters, numbers, hyphens, and underscores'),
  value: z.string()
    .min(1, 'Secret value is required')
    .max(10000, 'Secret value must be less than 10,000 characters'),
})

// Schema for listing secrets query
const listSecretsQuerySchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  active: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
})

type CreateSecretInput = z.infer<typeof createSecretSchema>
type ListSecretsQuery = z.infer<typeof listSecretsQuerySchema>

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

/**
 * POST /api/v1/secrets - Create a new secret
 *
 * Request body:
 * - project_id: UUID of the project
 * - name: Secret name (alphanumeric, hyphens, underscores)
 * - value: Plain text secret value to encrypt
 *
 * Response:
 * - success: true
 * - data: Secret object (without value)
 */
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: CreateSecretInput
    try {
      validatedData = createSecretSchema.parse(body)
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

    const { project_id, name, value } = validatedData
    const pool = getPool()

    // Validate project ownership
    const ownershipCheck = await validateProjectOwnership(project_id, developer)
    if (!ownershipCheck.valid) {
      const error = ownershipCheck.error === 'NOT_FOUND'
        ? 'Project not found'
        : 'You do not have access to this project'
      return errorResponse(ownershipCheck.error || 'FORBIDDEN', error, 403)
    }

    // Check if secret with same name already exists (any version)
    const existingSecret = await pool.query(
      `SELECT id, version, active FROM control_plane.secrets
       WHERE project_id = $1 AND name = $2
       ORDER BY version DESC
       LIMIT 1`,
      [project_id, name]
    )

    // If active secret exists, we need to rotate (use rotate endpoint)
    if (existingSecret.rows.length > 0 && existingSecret.rows[0].active) {
      return errorResponse(
        'SECRET_EXISTS',
        `Secret '${name}' already exists. Use the rotate endpoint to update it.`,
        409
      )
    }

    // Encrypt the value
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

    // Determine version (1 if new, next version if rotating inactive secret)
    const version = existingSecret.rows.length > 0
      ? existingSecret.rows[0].version + 1
      : 1

    // Create the secret with version=1, active=TRUE
    const result = await pool.query(
      `INSERT INTO control_plane.secrets
        (project_id, name, value_encrypted, version, active, created_by)
       VALUES ($1, $2, $3, $4, TRUE, $5)
       RETURNING id, project_id, name, version, active, created_at`,
      [project_id, name, valueEncrypted, version, developer.id]
    )

    const secret = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: secret.id,
        project_id: secret.project_id,
        name: secret.name,
        version: secret.version,
        active: secret.active,
        created_at: secret.created_at,
      },
    }, { status: 201 })

  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Secrets API] Create secret error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to create secret', 500)
  }
}

/**
 * GET /api/v1/secrets - List secrets for a project
 *
 * Query parameters:
 * - project_id: UUID of the project (required)
 * - active: Filter by active status (optional)
 * - limit: Maximum number of results (default: 50, max: 100)
 * - offset: Number of results to skip (default: 0)
 *
 * Response:
 * - success: true
 * - data: Array of secret objects (without values)
 */
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    let query: ListSecretsQuery
    try {
      query = listSecretsQuerySchema.parse(queryParams)
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

    // Validate project ownership
    const ownershipCheck = await validateProjectOwnership(query.project_id, developer)
    if (!ownershipCheck.valid) {
      const error = ownershipCheck.error === 'NOT_FOUND'
        ? 'Project not found'
        : 'You do not have access to this project'
      return errorResponse(ownershipCheck.error || 'FORBIDDEN', error, 403)
    }

    // Build query conditions
    const conditions: string[] = ['s.project_id = $1']
    const values: any[] = [query.project_id]
    let paramIndex = 2

    if (query.active !== undefined) {
      conditions.push(`s.active = $${paramIndex++}`)
      values.push(query.active)
    }

    const limit = query.limit || 50
    const offset = query.offset || 0

    values.push(limit, offset)

    // Query secrets (without value_encrypted)
    const result = await pool.query(
      `SELECT
        s.id, s.project_id, s.name, s.version, s.active,
        s.rotated_from, s.rotation_reason, s.created_at,
        s.created_by, s.expires_at
       FROM control_plane.secrets s
       WHERE ${conditions.join(' AND ')}
       ORDER BY s.name, s.version DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    )

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM control_plane.secrets s
       WHERE ${conditions.join(' AND ')}`,
      values.slice(0, paramIndex - 1)
    )

    return NextResponse.json({
      success: true,
      data: result.rows.map(s => ({
        id: s.id,
        project_id: s.project_id,
        name: s.name,
        version: s.version,
        active: s.active,
        rotated_from: s.rotated_from,
        rotation_reason: s.rotation_reason,
        created_at: s.created_at,
        expires_at: s.expires_at,
      })),
      meta: {
        limit,
        offset,
        total: parseInt(countResult.rows[0].total, 10),
      },
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('[Secrets API] List secrets error:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list secrets', 500)
  }
}
