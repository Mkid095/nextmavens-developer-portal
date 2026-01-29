import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { authenticateRequest, generateApiKey, hashApiKey } from '@/lib/auth'
import { logApiKeyAction, userActor } from '@nextmavens/audit-logs-database'
import {
  ApiKeyType,
  ApiKeyEnvironment,
  DEFAULT_SCOPES,
  getKeyPrefix,
  type ApiKey,
} from '@/lib/types/api-key.types'
import {
  getIdempotencyKey,
  withIdempotency,
  type IdempotencyResponse,
} from '@/lib/idempotency'

export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)

    const pool = getPool()

    // Ensure columns exist (auto-migrate)
    try {
      await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS name VARCHAR(255)`)
    } catch {
      // Ignore if column exists or migration fails
    }

    const result = await pool.query(
      `SELECT id, key_type, key_prefix, scopes, environment, created_at, last_used,
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
      scopes: key.scopes || [],
      environment: key.environment || 'live',
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
    const { name, projectId, key_type, environment } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Validate key_type if provided
    let validatedKeyType: ApiKeyType = 'public' // default
    if (key_type) {
      const validKeyTypes: ApiKeyType[] = ['public', 'secret', 'service_role', 'mcp']
      if (!validKeyTypes.includes(key_type)) {
        return NextResponse.json(
          { error: `Invalid key_type. Must be one of: ${validKeyTypes.join(', ')}` },
          { status: 400 }
        )
      }
      validatedKeyType = key_type as ApiKeyType
    } else {
      // For backwards compatibility, infer from name if not provided
      validatedKeyType = name.toLowerCase().includes('secret') ? 'secret' : 'public'
    }

    // Validate environment if provided
    let validatedEnvironment: ApiKeyEnvironment = 'live' // default
    if (environment) {
      const validEnvironments: ApiKeyEnvironment[] = ['live', 'test', 'dev']
      if (!validEnvironments.includes(environment)) {
        return NextResponse.json(
          { error: `Invalid environment. Must be one of: ${validEnvironments.join(', ')}` },
          { status: 400 }
        )
      }
      validatedEnvironment = environment as ApiKeyEnvironment
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

    // Get default scopes for the key type
    const scopes = DEFAULT_SCOPES[validatedKeyType]

    // Generate key prefix based on type and environment
    const keyPrefix = getKeyPrefix(validatedKeyType, validatedEnvironment)

    // Generate API key pair
    const publicKey = generateApiKey('public')
    const secretKey = generateApiKey('secret')
    const hashedSecretKey = hashApiKey(secretKey)

    const result = await pool.query(
      `INSERT INTO api_keys (project_id, key_type, key_prefix, key_hash, name, scopes, environment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, key_type, key_prefix, scopes, environment, created_at`,
      [finalProjectId, validatedKeyType, keyPrefix, hashedSecretKey, name, JSON.stringify(scopes), validatedEnvironment]
    )

    const apiKey = result.rows[0]

    // Log API key creation
    try {
      await logApiKeyAction.created(
        userActor(developer.id),
        apiKey.id.toString(),
        apiKey.key_type,
        scopes,
        {
          request: {
            ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            userAgent: req.headers.get('user-agent') || undefined,
          },
        }
      )
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      console.error('[Developer Portal] Failed to log API key creation:', auditError)
    }

    // Add warnings based on key type
    const warning = validatedKeyType === 'public'
      ? 'This key is intended for client-side use in browsers or mobile apps. It has read-only access and can be safely exposed in public code. Never use secret keys in client-side applications.'
      : validatedKeyType === 'service_role'
      ? 'WARNING: This is a service role key that bypasses row-level security (RLS) and has full administrative access. It must be kept secret and never exposed in client-side code. Only use this key in trusted server-side environments for admin operations.'
      : validatedKeyType === 'secret'
      ? 'This key must be kept secret and never exposed in client-side code (browsers, mobile apps). Only use this key in server-side environments where it cannot be accessed by users.'
      : undefined

    return NextResponse.json({
      apiKey: {
        id: apiKey.id.toString(),
        name: name,
        key_type: apiKey.key_type,
        key_prefix: apiKey.key_prefix,
        scopes: scopes,
        environment: apiKey.environment,
        public_key: publicKey,
        created_at: apiKey.created_at,
      },
      secretKey,
      warning,
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

    // First, get the key details for audit logging before deletion
    const keyDetails = await pool.query(
      `SELECT key_type FROM api_keys
       WHERE id = $1
         AND project_id IN (SELECT id FROM projects WHERE developer_id = $2)`,
      [keyId, developer.id]
    )

    if (keyDetails.rows.length === 0) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    await pool.query(
      `DELETE FROM api_keys
       WHERE id = $1
         AND project_id IN (SELECT id FROM projects WHERE developer_id = $2)`,
      [keyId, developer.id]
    )

    // Log API key revocation
    try {
      await logApiKeyAction.revoked(
        userActor(developer.id),
        keyId,
        'User requested deletion',
        {
          request: {
            ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            userAgent: req.headers.get('user-agent') || undefined,
          },
        }
      )
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      console.error('[Developer Portal] Failed to log API key revocation:', auditError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Developer Portal] Delete API key error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete API key' }, { status: 401 })
  }
}
