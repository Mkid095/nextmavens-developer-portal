import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { getPool } from '@/lib/db'

// GET /v1/projects - List all projects (with filtering)
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)

    // TODO: Implement filtering logic
    const pool = getPool()
    const result = await pool.query(
      'SELECT id, name, slug, status, created_at FROM control_plane.projects WHERE developer_id = $1 ORDER BY created_at DESC',
      [developer.id]
    )

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        { status: 401 }
      )
    }
    console.error('Error listing projects:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list projects' } },
      { status: 500 }
    )
  }
}

// POST /v1/projects - Create new project
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // TODO: Implement validation and project creation logic
    const pool = getPool()

    return NextResponse.json(
      {
        success: true,
        data: {
          id: 'temp-id',
          name: body.name || 'New Project',
          developer_id: developer.id,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        { status: 401 }
      )
    }
    console.error('Error creating project:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create project' } },
      { status: 500 }
    )
  }
}
