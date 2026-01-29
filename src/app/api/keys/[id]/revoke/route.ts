import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'
import {
  getIdempotencyKey,
  getIdempotencyKeySuffix,
  withIdempotencyWithKey,
  type IdempotencyResponse,
} from '@/lib/idempotency'
import { logAuditEntry, AuditLogType, AuditLogLevel } from '@/features/abuse-controls/lib/audit-logger'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/keys/:id/revoke
 *
 * Revoke an API key immediately by setting its status to 'revoked'.
 * This is different from deleting the key - the key record remains
 * but becomes immediately invalid for authentication.
 *
 * US-003: Implement Revoke Key API
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const developer = await authenticateRequest(req)
    const params = await context.params
    const keyId = params.id

    // Generate idempotency key: revoke:{key_id}
    const idempotencyKey = getIdempotencyKey('revoke', req.headers, keyId)

    // Execute with idempotency (TTL: 1 year - effectively permanent since revocation is permanent)
    const { result, idempotencyKey: returnedKey } = await withIdempotencyWithKey(
      idempotencyKey,
      async (): Promise<IdempotencyResponse> => {
        const pool = getPool()

        // Ensure status column exists
        try {
          await pool.query(`
            ALTER TABLE api_keys
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
            CONSTRAINT api_keys_status_check
            CHECK (status IN ('active', 'revoked', 'expired'))
          `)
        } catch (error) {
          // Column might already exist or constraint exists, ignore
          console.log('[Revoke API] Status column setup:', error)
        }

        // Get the key details with ownership verification
        const keyResult = await pool.query(
          `SELECT ak.*, p.developer_id
           FROM api_keys ak
           JOIN projects p ON ak.project_id = p.id
           WHERE ak.id = $1`,
          [keyId]
        )

        if (keyResult.rows.length === 0) {
          return {
            status: 404,
            headers: {},
            body: { error: 'API key not found' }
          }
        }

        const apiKey = keyResult.rows[0]

        // Verify ownership
        if (apiKey.developer_id !== developer.id) {
          return {
            status: 403,
            headers: {},
            body: { error: 'You do not have permission to revoke this key' }
          }
        }

        // Check if already revoked
        if (apiKey.status === 'revoked') {
          return {
            status: 200,
            headers: {},
            body: {
              success: true,
              message: 'API key was already revoked',
              revokedAt: apiKey.updated_at,
            }
          }
        }

        // Revoke the key by setting status to 'revoked'
        await pool.query(
          `UPDATE api_keys
           SET status = 'revoked',
               updated_at = NOW()
           WHERE id = $1`,
          [keyId]
        )

        // Log key revocation to audit logs
        try {
          await logAuditEntry({
            log_type: AuditLogType.MANUAL_INTERVENTION,
            severity: AuditLogLevel.INFO,
            developer_id: developer.id,
            action: 'key.revoked',
            details: {
              key_id: keyId,
              key_name: apiKey.name,
              key_type: apiKey.key_type,
              revoked_immediately: true,
            },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            user_agent: req.headers.get('user-agent') || undefined,
            occurred_at: new Date(),
          })
        } catch (auditError) {
          // Don't fail the request if audit logging fails
          console.error('[Revoke API] Failed to log key revocation:', auditError)
        }

        return {
          status: 200,
          headers: {},
          body: {
            success: true,
            message: 'API key revoked successfully',
            revokedKey: {
              id: apiKey.id.toString(),
              name: apiKey.name,
              key_type: apiKey.key_type,
              key_prefix: apiKey.key_prefix,
              status: 'revoked',
            },
          }
        }
      },
      { ttl: 31536000 } // 1 year TTL (revocation is permanent)
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
    console.error('[Revoke API] Revoke API key error:', error)
    const status = error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to revoke API key' },
      { status }
    )
  }
}
