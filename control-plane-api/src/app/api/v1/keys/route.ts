import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, type JwtPayload, generateApiKey, hashApiKey, getKeyPrefix, DEFAULT_API_KEY_SCOPES, mapProjectEnvironmentToKeyEnvironment, getMcpDefaultScopes } from '@/lib/auth'
import {
  createApiKeySchema,
  listApiKeysQuerySchema,
  type CreateApiKeyInput,
  type ListApiKeysQuery,
} from '@/lib/validation'
import { controlPlaneApiKeyRepository, controlPlaneProjectRepository } from '@/data'

// Helper function for standard error responses
function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

// GET /v1/keys - List API keys
export async function GET(req: NextRequest) {
  try {
    const developer = await authenticateRequest(req)

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
          error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    // Use repository to fetch API keys
    // Convert project_id to string if it's a number
    const projectId = query.project_id ? String(query.project_id) : undefined
    const { data, error } = await controlPlaneApiKeyRepository.findByDeveloper(developer.id, {
      project_id: projectId,
      key_type: query.key_type,
      environment: query.environment,
      limit: query.limit,
      offset: query.offset,
    })

    if (error) {
      console.error('Error listing API keys:', error)
      return errorResponse('INTERNAL_ERROR', 'Failed to list API keys', 500)
    }

    return NextResponse.json({
      success: true,
      data: data.map(k => ({
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
        limit: query.limit || 50,
        offset: query.offset || 0,
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
          error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        )
      }
      throw error
    }

    // Determine project ID
    let projectId = validatedData.project_id ? String(validatedData.project_id) : undefined
    if (!projectId) {
      // Get or create a default project for the developer
      const { data: defaultProject } = await controlPlaneProjectRepository.findFirstByDeveloper(developer.id)

      if (!defaultProject) {
        return errorResponse(
          'PROJECT_REQUIRED',
          'No project found. Please specify a project_id or create a project first.',
          400
        )
      }
      projectId = String(defaultProject.id)
    }

    // Validate project ownership and get project details
    const { valid, project, error: ownershipError } = await controlPlaneApiKeyRepository.validateProjectOwnership(
      projectId,
      developer.id
    )

    if (ownershipError) {
      console.error('Error validating project ownership:', ownershipError)
      return errorResponse('INTERNAL_ERROR', 'Failed to validate project ownership', 500)
    }

    if (!valid || !project) {
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
      scopes = validatedData.scopes || [...DEFAULT_API_KEY_SCOPES[validatedData.key_type]]
    }

    // US-010: Generate key prefix based on type and PROJECT environment
    // The key prefix is determined by the project's environment, not the requested key environment
    const projectEnvironment = project.environment || 'prod'
    const keyPrefix = getKeyPrefix(validatedData.key_type, projectEnvironment, mcpAccessLevel)
    const keyEnvironment = mapProjectEnvironmentToKeyEnvironment(projectEnvironment)

    // Generate API key pair with environment-specific prefix
    // US-010: Keys have environment-specific prefixes (nm_live_pk_, nm_dev_pk_, nm_staging_pk_)
    const publicKeySuffix = generateApiKey('public')
    const secretKeySuffix = generateApiKey('secret')
    const publicKey = `${keyPrefix}${publicKeySuffix}`
    const secretKey = `${keyPrefix}${secretKeySuffix}`
    const hashedSecretKey = hashApiKey(secretKey)

    // Create the API key using repository
    const { data: apiKey, error } = await controlPlaneApiKeyRepository.createWithColumns({
      project_id: projectId,
      key_type: validatedData.key_type,
      key_prefix: keyPrefix,
      key_hash: hashedSecretKey,
      name: validatedData.name,
      scopes,
      environment: keyEnvironment,
    })

    if (error || !apiKey) {
      console.error('Error creating API key:', error)
      return errorResponse('INTERNAL_ERROR', 'Failed to create API key', 500)
    }

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

