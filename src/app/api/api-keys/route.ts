import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest, generateApiKey, hashApiKey } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)

    const pool = getPool()

    // Ensure name column exists (auto-migrate)
    try {
      await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS name VARCHAR(255)`)
    } catch {
      // Ignore if column exists or migration fails
    }

    const result = await pool.query(
      `SELECT id, key_type, key_prefix, created_at, last_used,
              COALESCE(name, key_type || ' key') as name
       FROM api_keys
       WHERE project_id IN (SELECT id FROM projects WHERE developer_id = $1)
       ORDER BY created_at DESC`,
      [developer.id]
    )

    // Format the response to match expected structure
    const apiKeys = result.rows.map(key => ({
      id: key.id.toString(),
      name: key.name || `${key.key_type} key`,
      key_type: key.key_type,
      key_prefix: key.key_prefix,
      public_key: key.key_prefix, // Old keys only have prefix stored
      created_at: key.created_at,
    }))

    return NextResponse.json({ apiKeys })
  } catch (error: any) {
    console.error('[Developer Portal] Fetch API keys error:', error)
    const status = error.message === 'No token provided' || error.message === 'Invalid token' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Failed to fetch API keys' }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()
    const { name, projectId } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Get or create a default project for the developer
    const pool = getPool()

    // Ensure name column exists (auto-migrate)
    try {
      await pool.query(`
        ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS name VARCHAR(255)
      `)
    } catch {
      // Column might already exist, ignore error
    }

    // First check if developer has a default project
    let projectResult = await pool.query(
      'SELECT id FROM projects WHERE developer_id = $1 LIMIT 1',
      [developer.id]
    )

    let finalProjectId = projectId

    if (projectResult.rows.length === 0 && !projectId) {
      // Create a tenant first
      const tenantResult = await pool.query(
        "INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id",
        ['Default Project', 'default-project']
      )

      // Create a default project
      const newProject = await pool.query(
        "INSERT INTO projects (developer_id, project_name, tenant_id) VALUES ($1, $2, $3) RETURNING id",
        [developer.id, 'Default Project', tenantResult.rows[0].id]
      )
      finalProjectId = newProject.rows[0].id
    } else if (!finalProjectId) {
      finalProjectId = projectResult.rows[0].id
    }

    // Generate API key pair
    const publicKey = generateApiKey('public')
    const secretKey = generateApiKey('secret')
    const hashedSecretKey = hashApiKey(secretKey)

    // Determine key type from name (for backwards compatibility)
    const keyType = name.toLowerCase().includes('secret') ? 'secret' : 'public'
    const keyPrefix = keyType === 'secret' ? 'nm_live_sk_' : 'nm_live_pk_'

    const result = await pool.query(
      `INSERT INTO api_keys (project_id, key_type, key_prefix, key_hash, name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, key_type, key_prefix, created_at`,
      [finalProjectId, keyType, keyPrefix, hashedSecretKey, name]
    )

    const apiKey = result.rows[0]

    return NextResponse.json({
      apiKey: {
        id: apiKey.id.toString(),
        name: name,
        key_type: apiKey.key_type,
        key_prefix: apiKey.key_prefix,
        public_key: publicKey,
        created_at: apiKey.created_at,
      },
      secretKey,
    })
  } catch (error: any) {
    console.error('[Developer Portal] Create API key error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create API key' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const { searchParams } = new URL(req.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 })
    }

    const pool = getPool()

    await pool.query(
      `DELETE FROM api_keys
       WHERE id = $1
         AND project_id IN (SELECT id FROM projects WHERE developer_id = $2)`,
      [keyId, developer.id]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Developer Portal] Delete API key error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete API key' }, { status: 401 })
  }
}
