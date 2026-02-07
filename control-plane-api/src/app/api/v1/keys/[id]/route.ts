import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type JwtPayload } from '@/lib/auth'
import { getPool } from '@/lib/db'

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

// GET /v1/keys/:id - Get API key details
// Note: The secret key value is only shown on creation, not on retrieval
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const developer = await authenticateRequest(req)
    const params = await context.params
    const keyId = params.id
    const pool = getPool()

    // Get the key with ownership verification
    const result = await pool.query(
      `SELECT
        ak.id, ak.key_type, ak.key_prefix, ak.scopes, ak.environment,
        ak.name, ak.status, ak.usage_count, ak.last_used, ak.created_at,
        p.id as project_id, p.project_name, p.developer_id
      FROM api_keys ak
      JOIN projects p ON ak.project_id = p.id
      WHERE ak.id = $1`,
      [keyId]
    )

    if (result.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'API key not found', 404)
    }

    const apiKey = result.rows[0]

    // Verify ownership
    if (apiKey.developer_id !== developer.id) {
      return errorResponse('FORBIDDEN', 'You do not have permission to view this key', 403)
    }

    // Return key details (without the secret key value)
    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name || `${apiKey.key_type} key`,
        key_type: apiKey.key_type,
        key_prefix: apiKey.key_prefix,
        scopes: apiKey.scopes || [],
        environment: apiKey.environment,
        project_id: apiKey.project_id,
        project_name: apiKey.project_name,
        status: apiKey.status || 'active',
        usage_count: apiKey.usage_count || 0,
        last_used: apiKey.last_used,
        created_at: apiKey.created_at,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error getting API key:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to get API key', 500)
  }
}

