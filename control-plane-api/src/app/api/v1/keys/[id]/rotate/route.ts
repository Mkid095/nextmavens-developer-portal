import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type JwtPayload, generateApiKey, hashApiKey, getKeyPrefix, DEFAULT_API_KEY_SCOPES, mapProjectEnvironmentToKeyEnvironment } from '@/lib/auth'
import { getPool } from '@/lib/db'
import { emitEvent } from '@/features/webhooks'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /v1/keys/:id/rotate - Rotate an API key with a grace period
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const developer = await authenticateRequest(req)
    const params = await context.params
    const keyId = params.id
    const pool = getPool()

    // Ensure columns exist
    try {
      await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS rotated_to UUID`)
      await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`)
      await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS environment api_key_environment DEFAULT 'live'`)
      await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS name VARCHAR(255)`)
      await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS scopes JSONB DEFAULT '[]'::jsonb`)
    } catch {
      // Columns might already exist, ignore errors
    }

    // Get the existing key details with ownership verification and project environment
    const existingKeyResult = await pool.query(
      `SELECT ak.*, p.developer_id, p.environment as project_environment
       FROM api_keys ak
       JOIN projects p ON ak.project_id = p.id
       WHERE ak.id = $1`,
      [keyId]
    )

    if (existingKeyResult.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'API key not found', 404)
    }

    const existingKey = existingKeyResult.rows[0]

    // Verify ownership
    if (existingKey.developer_id !== developer.id) {
      return errorResponse('FORBIDDEN', 'You do not have permission to rotate this key', 403)
    }

    // Get key_type from existing key
    const keyType = existingKey.key_type || 'secret'

    // US-010: Use project's environment for key prefix (not the key's environment)
    const projectEnvironment = existingKey.project_environment || 'prod'
    const keyPrefix = getKeyPrefix(keyType, projectEnvironment)
    const keyEnvironment = mapProjectEnvironmentToKeyEnvironment(projectEnvironment)

    // Generate new API key pair with environment-specific prefix
    const publicKeySuffix = generateApiKey('public')
    const secretKeySuffix = generateApiKey('secret')
    const publicKey = `${keyPrefix}${publicKeySuffix}`
    const secretKey = `${keyPrefix}${secretKeySuffix}`
    const hashedSecretKey = hashApiKey(secretKey)

    // Get default scopes for the key type
    const scopes = existingKey.scopes || DEFAULT_API_KEY_SCOPES[keyType]

    // Create new key version
    const newKeyResult = await pool.query(
      `INSERT INTO api_keys (project_id, key_type, key_prefix, key_hash, name, scopes, environment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, key_type, key_prefix, scopes, environment, name, created_at`,
      [existingKey.project_id, keyType, keyPrefix, hashedSecretKey, existingKey.name, JSON.stringify(scopes), keyEnvironment]
    )

    const newKey = newKeyResult.rows[0]

    // Update old key: set rotated_to and expires_at (24 hours from now)
    await pool.query(
      `UPDATE api_keys
       SET rotated_to = $1,
           expires_at = NOW() + INTERVAL '24 hours'
       WHERE id = $2`,
      [newKey.id, keyId]
    )

    // US-007: Emit key.rotated event (fire and forget)
    emitEvent(existingKey.project_id, 'key.rotated', {
      project_id: existingKey.project_id,
      old_key_id: keyId,
      new_key_id: newKey.id,
      key_name: existingKey.name,
      key_type: keyType,
      rotated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }).catch(err => {
      console.error('[Keys API] Failed to emit key.rotated event:', err)
    })

    return NextResponse.json({
      success: true,
      data: {
        new_key: {
          id: newKey.id,
          name: newKey.name,
          key_type: newKey.key_type,
          key_prefix: newKey.key_prefix,
          scopes: scopes,
          environment: newKey.environment,
          public_key: publicKey,
          secret_key: secretKey, // Only shown on rotation
          created_at: newKey.created_at,
        },
        old_key: {
          id: keyId,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        message: 'Key rotated successfully. The old key will remain valid for 24 hours.',
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error rotating API key:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to rotate API key', 500)
  }
}
