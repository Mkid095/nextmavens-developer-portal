import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest, generateApiKey, hashApiKey } from '@/lib/auth'
import { getKeyPrefix, type ApiKey, type ApiKeyType, type ApiKeyEnvironment } from '@/lib/types/api-key.types'
import {
  getIdempotencyKey,
  getIdempotencyKeySuffix,
  withIdempotencyWithKey,
  type IdempotencyResponse,
} from '@/lib/idempotency'
import { DEFAULT_SCOPES } from '@/lib/types/api-key.types'
import { logAuditEntry, AuditLogType, AuditLogLevel } from '@/features/abuse-controls/lib/audit-logger'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const developer = await authenticateRequest(req)
    const params = await context.params
    const keyId = params.id

    // Generate idempotency key: rotate_key:{key_id}
    const idempotencyKey = getIdempotencyKey('rotate_key', req.headers, keyId)

    // Execute with idempotency (TTL: 5 minutes = 300 seconds)
    const { result, idempotencyKey: returnedKey } = await withIdempotencyWithKey(
      idempotencyKey,
      async (): Promise<IdempotencyResponse> => {
        const pool = getPool()

        // Get the existing key details
        const existingKeyResult = await pool.query(
          `SELECT ak.*, p.developer_id
           FROM api_keys ak
           JOIN projects p ON ak.project_id = p.id
           WHERE ak.id = $1`,
          [keyId]
        )

        if (existingKeyResult.rows.length === 0) {
          return {
            status: 404,
            headers: {},
            body: { error: 'API key not found' }
          }
        }

        const existingKey = existingKeyResult.rows[0]

        // Verify ownership
        if (existingKey.developer_id !== developer.id) {
          return {
            status: 403,
            headers: {},
            body: { error: 'You do not have permission to rotate this key' }
          }
        }

        // Get key_type and environment from existing key
        const keyType: ApiKeyType = existingKey.key_type || 'secret'
        const environment: ApiKeyEnvironment = existingKey.environment || 'live'

        // Generate new API key pair
        const publicKey = generateApiKey('public')
        const secretKey = generateApiKey('secret')
        const hashedSecretKey = hashApiKey(secretKey)

        // Generate key prefix based on type and environment
        const keyPrefix = getKeyPrefix(keyType, environment)

        // Get default scopes for the key type
        const scopes = existingKey.scopes || DEFAULT_SCOPES[keyType]

        // Create new key version
        const newKeyResult = await pool.query(
          `INSERT INTO api_keys (project_id, key_type, key_prefix, key_hash, name, scopes, environment)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, key_type, key_prefix, scopes, environment, created_at`,
          [existingKey.project_id, keyType, keyPrefix, hashedSecretKey, existingKey.name, JSON.stringify(scopes), environment]
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

        // Log key rotation to audit logs
        try {
          await logAuditEntry({
            log_type: AuditLogType.MANUAL_INTERVENTION,
            severity: AuditLogLevel.INFO,
            developer_id: developer.id,
            action: 'key.rotated',
            details: {
              old_key_id: keyId,
              new_key_id: newKey.id.toString(),
              key_name: existingKey.name,
              key_type: keyType,
            },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            user_agent: req.headers.get('user-agent') || undefined,
            occurred_at: new Date(),
          })
        } catch (auditError) {
          // Don't fail the request if audit logging fails
          console.error('[Developer Portal] Failed to log key rotation:', auditError)
        }

        return {
          status: 200,
          headers: {},
          body: {
            apiKey: {
              id: newKey.id.toString(),
              name: existingKey.name,
              key_type: newKey.key_type,
              key_prefix: newKey.key_prefix,
              scopes: scopes,
              environment: newKey.environment,
              public_key: publicKey,
              created_at: newKey.created_at,
            },
            secretKey,
            message: 'Key rotated successfully. The old key will remain valid for 24 hours.',
            oldKeyId: keyId,
            oldKeyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }
        }
      },
      { ttl: 300 } // 5 minutes TTL
    )

    // Return the response with the appropriate status code and idempotency key header
    return NextResponse.json(result.body, {
      status: result.status,
      headers: {
        'Idempotency-Key': getIdempotencyKeySuffix(returnedKey),
        ...result.headers,
      },
    })
  } catch (error: any) {
    console.error('[Developer Portal] Rotate API key error:', error)
    return NextResponse.json({ error: error.message || 'Failed to rotate API key' }, { status: 401 })
  }
}
