import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const { searchParams } = new URL(req.url)
    const projectSlug = searchParams.get('project')

    if (!projectSlug) {
      return NextResponse.json({ error: 'Project slug is required' }, { status: 400 })
    }

    const pool = getPool()

    // Get project info
    const projectResult = await pool.query(
      `SELECT p.id, t.slug as tenant_slug
       FROM projects p
       JOIN tenants t ON p.tenant_id = t.id
       WHERE p.developer_id = $1 AND t.slug = $2`,
      [developer.id, projectSlug]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const tenantSlug = projectResult.rows[0].tenant_slug

    // Get tables in the tenant's schema
    const tablesResult = await pool.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = $1
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `, [`tenant_${tenantSlug}`])

    const tables = tablesResult.rows.map(row => ({
      name: row.table_name,
      type: 'table',
    }))

    return NextResponse.json({ tables })
  } catch (error: any) {
    console.error('[Studio] Fetch tables error:', error)
    const status = error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tables' },
      { status }
    )
  }
}
