import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { generateApiKey, generateSlug, hashApiKey } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()
    const { project_name, webhook_url, allowed_origins } = body

    // Validation
    if (!project_name || project_name.length < 2 || project_name.length > 100) {
      return NextResponse.json(
        { error: 'Project name must be between 2 and 100 characters' },
        { status: 400 }
      )
    }

    const pool = getPool()
    const slug = generateSlug(project_name)

    // Create tenant
    const tenantResult = await pool.query(
      `INSERT INTO tenants (name, slug, settings)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [project_name, slug, {}]
    )

    const tenantId = tenantResult.rows[0].id

    // Generate API keys
    const publicKey = generateApiKey('public')
    const secretKey = generateApiKey('secret')

    // Create project
    const projectResult = await pool.query(
      `INSERT INTO projects (
         developer_id, project_name, tenant_id, webhook_url, allowed_origins, rate_limit
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, project_name, tenant_id, created_at`,
      [developer.id, project_name, tenantId, webhook_url, allowed_origins, 1000]
    )

    const project = projectResult.rows[0]

    // Create API keys
    await pool.query(
      `INSERT INTO api_keys (project_id, key_type, key_prefix, key_hash, scopes)
       VALUES ($1, 'public', $2, $3, $4)`,
      [project.id, 'nm_live_pk_', hashApiKey(publicKey), ['read']]
    )

    await pool.query(
      `INSERT INTO api_keys (project_id, key_type, key_prefix, key_hash, scopes)
       VALUES ($1, 'secret', $2, $3, $4)`,
      [project.id, 'nm_live_sk_', hashApiKey(secretKey), ['read', 'write']]
    )

    return NextResponse.json(
      {
        project: {
          id: project.id,
          name: project.project_name,
          slug: slug,
          tenant_id: project.tenant_id,
          created_at: project.created_at,
        },
        api_keys: {
          public_key: publicKey,
          secret_key: secretKey,
        },
        endpoints: {
          gateway: 'https://api.nextmavens.cloud',
          auth: 'https://auth.nextmavens.cloud',
          graphql: 'https://graphql.nextmavens.cloud',
          rest: 'https://api.nextmavens.cloud',
          realtime: 'wss://realtime.nextmavens.cloud',
          storage: 'https://telegram.nextmavens.cloud',
        },
        database_url: `postgresql://nextmavens:Elishiba@95@nextmavens-db-m4sxnf.1.mvuvh68efk7jnvynmv8r2jm2u:5432/nextmavens?options=--search_path=tenant_${slug}`,
        warning: "Save your API keys now! You won't be able to see the secret key again.",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Developer Portal] Create project error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()

    const result = await pool.query(
      `SELECT
         p.id, p.project_name, p.tenant_id, p.webhook_url,
         p.allowed_origins, p.rate_limit, p.created_at,
         t.slug as tenant_slug,
         COUNT(DISTINCT ak.id) as api_keys_count
       FROM projects p
       JOIN tenants t ON p.tenant_id = t.id
       LEFT JOIN api_keys ak ON p.id = ak.project_id
       WHERE p.developer_id = $1
       GROUP BY p.id, t.slug
       ORDER BY p.created_at DESC`,
      [developer.id]
    )

    const projects = result.rows.map(p => ({
      id: p.id,
      name: p.project_name,
      slug: p.tenant_slug,
      created_at: p.created_at,
    }))

    return NextResponse.json({ projects })
  } catch (error: any) {
    console.error('[Developer Portal] List projects error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list projects' },
      { status: error.message === 'No token provided' ? 401 : 500 }
    )
  }
}
