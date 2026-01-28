import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; table: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const { slug, table } = params

    const pool = getPool()

    // Verify project access
    const projectResult = await pool.query(
      `SELECT p.id, t.slug as tenant_slug
       FROM projects p
       JOIN tenants t ON p.tenant_id = t.id
       WHERE p.developer_id = $1 AND t.slug = $2`,
      [developer.id, slug]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const tenantSlug = projectResult.rows[0].tenant_slug
    const schemaName = `tenant_${tenantSlug}`

    // Validate table name to prevent SQL injection
    const validTableName = table.match(/^[a-zA-Z0-9_]+$/)
    if (!validTableName) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    // Get table columns
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = $1
      AND table_name = $2
      ORDER BY ordinal_position
    `, [schemaName, table])

    if (columnsResult.rows.length === 0) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const columns = columnsResult.rows.map(col => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES',
      default: col.column_default,
    }))

    // Get table data (limit to 100 rows)
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const dataResult = await pool.query(
      `SELECT * FROM ${schemaName}.${table} LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    // Get total row count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM ${schemaName}.${table}`,
      []
    )

    return NextResponse.json({
      columns,
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('[Studio] Fetch table data error:', error)
    const status = error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to fetch table data' },
      { status }
    )
  }
}
