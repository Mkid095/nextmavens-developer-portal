import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// GET /api/projects/by-slug/:slug - Get project by slug
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()
    const slug = params.slug

    // Query project by slug with ownership check
    const result = await pool.query(
      `SELECT id, project_name, slug, tenant_id, status, environment, created_at
       FROM projects
       WHERE slug = $1 AND developer_id = $2`,
      [slug, developer.id]
    )

    if (result.rows.length === 0) {
      return errorResponse('NOT_FOUND', 'Project not found', 404)
    }

    const project = result.rows[0]

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.project_name,
        slug: project.slug,
        tenant_id: project.tenant_id,
        status: project.status,
        environment: project.environment,
        created_at: project.created_at,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error fetching project by slug:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch project', 500)
  }
}
