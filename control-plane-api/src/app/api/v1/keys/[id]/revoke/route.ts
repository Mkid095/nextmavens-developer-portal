import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

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

// DELETE /v1/keys/:id/revoke - Revoke an API key immediately
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const developer = await authenticateRequest(req)
    const params = await context.params
    const keyId = params.id
    const pool = getPool()

    // Ensure status column exists
    try {
      await pool.query(`
        ALTER TABLE api_keys
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
        CONSTRAINT api_keys_status_check
        CHECK (status IN ('active', 'revoked', 'expired'))
      `)
    } catch {
      // Column might already exist or constraint exists, ignore
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
      return errorResponse('NOT_FOUND', 'API key not found', 404)
    }

    const apiKey = keyResult.rows[0]

    // Verify ownership
    if (apiKey.developer_id !== developer.id) {
      return errorResponse('FORBIDDEN', 'You do not have permission to revoke this key', 403)
    }

    // Check if already revoked
    if (apiKey.status === 'revoked') {
      return NextResponse.json({
        success: true,
        message: 'API key was already revoked',
        data: {
          id: apiKey.id,
          name: apiKey.name,
          status: 'revoked',
        }
      })
    }

    // Revoke the key by setting status to 'revoked'
    await pool.query(
      `UPDATE api_keys
       SET status = 'revoked',
           updated_at = NOW()
       WHERE id = $1`,
      [keyId]
    )

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
      data: {
        id: apiKey.id,
        name: apiKey.name || `${apiKey.key_type} key`,
        key_type: apiKey.key_type,
        key_prefix: apiKey.key_prefix,
        status: 'revoked',
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error revoking API key:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to revoke API key', 500)
  }
}

