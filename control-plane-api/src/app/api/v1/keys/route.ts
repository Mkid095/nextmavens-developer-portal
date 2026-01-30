import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload, generateApiKey, hashApiKey, getKeyPrefix, DEFAULT_API_KEY_SCOPES, mapProjectEnvironmentToKeyEnvironment, getMcpDefaultScopes } from '@/lib/auth'
import { getPool } from '@/lib/db'
import {
  createApiKeySchema,
  listApiKeysQuerySchema,
  type CreateApiKeyInput,
  type ListApiKeysQuery,
} from '@/lib/validation'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// Helper function to validate project ownership and return project details
async function validateProjectOwnership(
  projectId: string,
  developer: JwtPayload
): Promise<{ valid: boolean; project?: any }> {
  const pool = getPool()
  const result = await pool.query(
    'SELECT id, developer_id, project_name, tenant_id, status, environment FROM projects WHERE id = $1',
    [projectId]
  )

  if (result.rows.length === 0) {
    return { valid: false }
  }

  const project = result.rows[0]
  if (project.developer_id !== developer.id) {
    return { valid: false, project }
  }

  return { valid: true, project }
}

// GET /v1/keys - List API keys
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const pool = getPool()

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams
    const queryParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryParams[key] = value
    })

    let query: ListApiKeysQuery = {}
    try {
      query = listApiKeysQuerySchema.parse(queryParams)
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(
          'VALIDATION_ERROR',
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    // Build query with filters
    const conditions: string[] = ['p.developer_id = $1']
    const values: any[] = [developer.id]
    let paramIndex = 2

    if (query.project_id) {
      conditions.push(`ak.project_id = $${paramIndex++}`)
      values.push(query.project_id)
    }

    if (query.key_type) {
      conditions.push(`ak.key_type = $${paramIndex++}`)
      values.push(query.key_type)
    }

    if (query.environment) {
      conditions.push(`ak.environment = $${paramIndex++}`)
      values.push(query.environment)
    }

    // Filter out revoked/expired keys by default
    conditions.push(`(ak.status IS NULL OR ak.status = 'active')`)

    const limit = query.limit || 50
    const offset = query.offset || 0

    values.push(limit, offset)

    const result = await pool.query(
      `SELECT
        ak.id, ak.key_type, ak.key_prefix, ak.scopes, ak.environment,
        ak.name, ak.status, ak.usage_count, ak.last_used, ak.created_at,
        p.id as project_id, p.project_name
      FROM api_keys ak
      JOIN projects p ON ak.project_id = p.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ak.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    )

    return NextResponse.json({
      success: true,
      data: result.rows.map(k => ({
        id: k.id,
        name: k.name || `${k.key_type} key`,
        key_type: k.key_type,
        key_prefix: k.key_prefix,
        scopes: k.scopes || [],
        environment: k.environment,
        project_id: k.project_id,
        project_name: k.project_name,
        status: k.status || 'active',
        usage_count: k.usage_count || 0,
        last_used: k.last_used,
        created_at: k.created_at,
      })),
      meta: {
        limit,
        offset,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error listing API keys:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to list API keys', 500)
  }
}

// POST /v1/keys - Create new API key
export async function POST(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)
    const body = await req.json()

    // Validate request body
    let validatedData: CreateApiKeyInput
    try {
      validatedData = createApiKeySchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(
          'VALIDATION_ERROR',
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    const pool = getPool()

    // Determine project ID
    let projectId = validatedData.project_id
    if (!projectId) {
      // Get or create a default project for the developer
      const projectResult = await pool.query(
        'SELECT id FROM projects WHERE developer_id = $1 LIMIT 1',
        [developer.id]
      )

      if (projectResult.rows.length === 0) {
        return errorResponse(
          'PROJECT_REQUIRED',
          'No project found. Please specify a project_id or create a project first.',
          400
        )
      }
      projectId = projectResult.rows[0].id
    }

    // Validate project ownership and get project details
    const ownershipCheck = await validateProjectOwnership(projectId, developer)
    if (!ownershipCheck.valid) {
      return errorResponse('FORBIDDEN', 'You do not have access to this project', 403)
    }

    // US-003: Implement MCP Read-Only Token
    // For MCP keys, validate that mcp_access_level is provided and determine scopes based on access level
    let scopes: string[]
    let mcpAccessLevel: 'ro' | 'rw' | 'admin' | undefined

    if (validatedData.key_type === 'mcp') {
      // Default to 'ro' (read-only) if not specified
      mcpAccessLevel = validatedData.mcp_access_level || 'ro'
      // Get default scopes for the specified MCP access level
      scopes = validatedData.scopes || Array.from(getMcpDefaultScopes(mcpAccessLevel))
    } else {
      // For non-MCP keys, use provided scopes or default for key type
      scopes = validatedData.scopes || DEFAULT_API_KEY_SCOPES[validatedData.key_type]
    }

    // US-010: Generate key prefix based on type and PROJECT environment
    // The key prefix is determined by the project's environment, not the requested key environment
    const projectEnvironment = ownershipCheck.project.environment || 'prod'
    const keyPrefix = getKeyPrefix(validatedData.key_type, projectEnvironment, mcpAccessLevel)
    const keyEnvironment = mapProjectEnvironmentToKeyEnvironment(projectEnvironment)

    // Generate API key pair with environment-specific prefix
    // US-010: Keys have environment-specific prefixes (nm_live_pk_, nm_dev_pk_, nm_staging_pk_)
    const publicKeySuffix = generateApiKey('public')
    const secretKeySuffix = generateApiKey('secret')
    const publicKey = `${keyPrefix}${publicKeySuffix}`
    const secretKey = `${keyPrefix}${secretKeySuffix}`
    const hashedSecretKey = hashApiKey(secretKey)

    // Ensure columns exist
    try {
      await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS name VARCHAR(255)`)
      await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS environment api_key_environment DEFAULT 'live'`)
      await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`)
      await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0`)
      await pool.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used TIMESTAMPTZ`)
    } catch {
      // Columns might already exist, ignore errors
    }

    // Create the API key
    const dbResult = await pool.query(
      `INSERT INTO api_keys (project_id, key_type, key_prefix, key_hash, name, scopes, environment)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, key_type, key_prefix, scopes, environment, name, created_at`,
      [projectId, validatedData.key_type, keyPrefix, hashedSecretKey, validatedData.name, JSON.stringify(scopes), keyEnvironment]
    )

    const apiKey = dbResult.rows[0]

    // Add warning based on key type
    let warning: string | undefined
    if (validatedData.key_type === 'public') {
      warning = 'This key is intended for client-side use in browsers or mobile apps. It has read-only access and can be safely exposed in public code.'
    } else if (validatedData.key_type === 'service_role') {
      warning = 'WARNING: This is a service role key that bypasses row-level security (RLS) and has full administrative access. It must be kept secret and never exposed in client-side code.'
    } else if (validatedData.key_type === 'secret') {
      warning = 'This key must be kept secret and never exposed in client-side code (browsers, mobile apps). Only use this key in server-side environments.'
    } else if (validatedData.key_type === 'mcp') {
      // US-003: MCP token warning based on access level
      const accessLevel = mcpAccessLevel || 'ro'
      if (accessLevel === 'ro') {
        warning = 'This is an MCP (Model Context Protocol) read-only token. It can read data but cannot modify it. Suitable for AI assistants and code generation tools.'
      } else if (accessLevel === 'rw') {
        warning = 'WARNING: This is an MCP (Model Context Protocol) read-write token. It can both read and modify your data. Only grant to trusted AI systems.'
      } else if (accessLevel === 'admin') {
        warning = 'CRITICAL WARNING: This is an MCP (Model Context Protocol) admin token with full access including data deletion. Only grant to highly trusted AI operations tools.'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key_type: apiKey.key_type,
        key_prefix: apiKey.key_prefix,
        scopes: scopes,
        environment: apiKey.environment,
        public_key: publicKey,
        secret_key: secretKey, // Only shown on creation
        created_at: apiKey.created_at,
      },
      warning,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'No token provided') {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401)
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401)
    }
    console.error('Error creating API key:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to create API key', 500)
  }
}
