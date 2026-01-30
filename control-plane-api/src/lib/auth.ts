import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { createError, ErrorCode } from './errors'

const JWT_SECRET = process.env.JWT_SECRET
const REFRESH_SECRET = process.env.REFRESH_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

if (!REFRESH_SECRET) {
  throw new Error('REFRESH_SECRET environment variable is required')
}

// Type guards to ensure secrets are strings (TypeScript type narrowing)
const getJwtSecret = (): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return JWT_SECRET
}

const getRefreshSecret = (): string => {
  if (!REFRESH_SECRET) {
    throw new Error('REFRESH_SECRET environment variable is required')
  }
  return REFRESH_SECRET
}

export interface Developer {
  id: string
  email: string
  name: string
  organization?: string
}

/**
 * JWT payload with project_id claim.
 * US-001: Require project_id in JWT
 */
export interface JwtPayload {
  id: string
  email: string
  project_id: string
}

export function generateAccessToken(developer: Developer, projectId: string): string {
  return jwt.sign(
    { id: developer.id, email: developer.email, project_id: projectId },
    getJwtSecret(),
    { expiresIn: '1h' }
  )
}

export function generateRefreshToken(developerId: string): string {
  return jwt.sign(
    { id: developerId },
    getRefreshSecret(),
    { expiresIn: '7d' }
  )
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    if (typeof decoded === 'string') {
      throw createError(ErrorCode.KEY_INVALID, 'Invalid token format')
    }
    // Ensure the decoded token has the required properties
    if (!decoded.id || !decoded.email) {
      throw createError(ErrorCode.KEY_INVALID, 'Invalid token structure')
    }
    // US-001: Require project_id in JWT
    if (!decoded.project_id) {
      throw createError(ErrorCode.KEY_INVALID, 'Missing project_id claim')
    }
    return decoded as unknown as JwtPayload
  } catch (error) {
    // If it's already a PlatformError, re-throw it
    if (error instanceof Error && error.name === 'PlatformError') {
      throw error
    }
    // Otherwise wrap as KEY_INVALID
    if (error instanceof Error && error.message.includes('jwt')) {
      throw createError(ErrorCode.KEY_INVALID, 'Invalid or expired token')
    }
    throw createError(ErrorCode.KEY_INVALID, 'Invalid token')
  }
}

/**
 * US-001: Authenticate a request and return the JWT payload.
 * Verifies that project_id claim exists in the token.
 * @throws PlatformError with AUTHENTICATION_ERROR or KEY_INVALID code if authentication fails
 */
export async function authenticateRequest(req: NextRequest): Promise<JwtPayload> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError(ErrorCode.AUTHENTICATION_ERROR, 'No token provided')
  }
  const token = authHeader.substring(7)
  return verifyAccessToken(token)
}

/**
 * Generate an API key with the specified format.
 * Format: {prefix}_{random_bytes}
 * Example: nm_live_pk_abc123def456...
 */
export function generateApiKey(type: 'public' | 'secret'): string {
  const prefix = type === 'public' ? 'pk' : 'sk'
  const randomBytesHex = randomBytes(32).toString('hex')
  return `${prefix}_${randomBytesHex}`
}

/**
 * Hash an API key for secure storage.
 * Uses SHA-256 with a key-specific salt.
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex')
}

/**
 * Map project environment to API key prefix environment.
 * US-010: Environment-Specific API Key Prefixes
 * - prod -> live (production keys use "live" prefix)
 * - dev -> dev (development keys use "dev" prefix)
 * - staging -> staging (staging keys use "staging" prefix)
 */
export function mapProjectEnvironmentToKeyEnvironment(
  projectEnvironment: 'prod' | 'dev' | 'staging'
): 'live' | 'dev' | 'staging' {
  const envMap: Record<'prod' | 'dev' | 'staging', 'live' | 'dev' | 'staging'> = {
    prod: 'live',
    dev: 'dev',
    staging: 'staging',
  }
  return envMap[projectEnvironment]
}

/**
 * Get the key prefix based on key type and project environment.
 * US-010: Environment-Specific API Key Prefixes
 * Format: nm_{env}_{type}_pk/sk
 * Examples:
 * - Prod keys: nm_live_pk_, nm_live_sk_
 * - Dev keys: nm_dev_pk_, nm_dev_sk_
 * - Staging keys: nm_staging_pk_, nm_staging_sk_
 *
 * @param keyType - The type of API key (public, secret, service_role, mcp)
 * @param projectEnvironment - The project's environment (prod, dev, staging)
 * @returns The key prefix string
 */
export function getKeyPrefix(
  keyType: 'public' | 'secret' | 'service_role' | 'mcp',
  projectEnvironment: 'prod' | 'dev' | 'staging'
): string {
  const keyEnvironment = mapProjectEnvironmentToKeyEnvironment(projectEnvironment)
  const typeMap = {
    public: 'pk',
    secret: 'sk',
    service_role: 'srv_sk',
    mcp: 'mcp_sk',
  }
  return `nm_${keyEnvironment}_${typeMap[keyType]}_`
}

/**
 * Default scopes for each API key type.
 * For MCP tokens, scopes are defined per access level (ro, rw, admin).
 *
 * US-002: MCP tokens default to read-only for safe default behavior.
 * - mcp_ro: db:select, storage:read, realtime:subscribe (no auth, no graphql)
 * - mcp_rw: All ro scopes plus db:insert, db:update, storage:write, graphql:execute
 * - mcp_admin: All rw scopes plus db:delete, realtime:publish, auth:manage
 */
export const DEFAULT_API_KEY_SCOPES = {
  public: ['db:select', 'storage:read', 'auth:signin', 'realtime:subscribe'],
  secret: [
    'db:select',
    'db:insert',
    'db:update',
    'db:delete',
    'storage:read',
    'storage:write',
    'auth:manage',
    'graphql:execute',
  ],
  service_role: [
    'db:select',
    'db:insert',
    'db:update',
    'db:delete',
    'storage:read',
    'storage:write',
    'auth:manage',
    'graphql:execute',
    'realtime:subscribe',
    'realtime:publish',
    'admin:all',
  ],
  // MCP default scopes per access level
  mcp_ro: ['db:select', 'storage:read', 'realtime:subscribe'],
  mcp_rw: [
    'db:select',
    'db:insert',
    'db:update',
    'storage:read',
    'storage:write',
    'realtime:subscribe',
    'graphql:execute',
  ],
  mcp_admin: [
    'db:select',
    'db:insert',
    'db:update',
    'db:delete',
    'storage:read',
    'storage:write',
    'realtime:subscribe',
    'realtime:publish',
    'graphql:execute',
    'auth:manage',
  ],
} as const

/**
 * Get default scopes for an MCP token based on its access level.
 * @param mcpAccessLevel - The MCP access level (ro, rw, admin)
 * @returns Array of default scopes for the specified access level
 */
export function getMcpDefaultScopes(mcpAccessLevel: 'ro' | 'rw' | 'admin'): readonly string[] {
  return DEFAULT_API_KEY_SCOPES[`mcp_${mcpAccessLevel}`] || DEFAULT_API_KEY_SCOPES.mcp_ro
}
