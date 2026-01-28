import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const pool = getPool()
    const result = await pool.query(
      `SELECT
         p.id, p.project_name, p.tenant_id, p.webhook_url,
         p.allowed_origins, p.rate_limit, p.created_at,
         t.slug as tenant_slug
       FROM projects p
       JOIN tenants t ON p.tenant_id = t.id
       WHERE p.developer_id = $1 AND t.slug = $2`,
      [developer.id, slug]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = result.rows[0]

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.project_name,
        slug: project.tenant_slug,
        tenant_id: project.tenant_id,
        webhook_url: project.webhook_url,
        allowed_origins: project.allowed_origins,
        rate_limit: project.rate_limit,
        created_at: project.created_at,
      },
    })
  } catch (error: any) {
    console.error('[Developer Portal] Get project by slug error:', error)
    const status = error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project' },
      { status }
    )
  }
}
