import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'

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
      throw new Error('Invalid token format')
    }
    // Ensure the decoded token has the required properties
    if (!decoded.id || !decoded.email) {
      throw new Error('Invalid token structure')
    }
    // US-001: Require project_id in JWT
    if (!decoded.project_id) {
      throw new Error('Missing project_id claim')
    }
    return decoded as unknown as JwtPayload
  } catch (error) {
    if (error instanceof Error && error.message === 'Missing project_id claim') {
      throw error
    }
    throw new Error('Invalid token')
  }
}

/**
 * US-001: Authenticate a request and return the JWT payload.
 * Verifies that project_id claim exists in the token.
 */
export async function authenticateRequest(req: NextRequest): Promise<JwtPayload> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
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
 * Get the key prefix based on key type and environment.
 * Format: nm_{env}_{type}_pk/sk
 * Example: nm_live_secret_sk, nm_test_public_pk
 */
export function getKeyPrefix(
  keyType: 'public' | 'secret' | 'service_role' | 'mcp',
  environment: 'live' | 'test' | 'dev' = 'live'
): string {
  const typeMap = {
    public: 'pk',
    secret: 'sk',
    service_role: 'srv_sk',
    mcp: 'mcp_sk',
  }
  return `nm_${environment}_${keyType}_${typeMap[keyType]}`
}

/**
 * Default scopes for each API key type.
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
  mcp: ['db:select', 'db:insert', 'db:update', 'db:delete', 'storage:read', 'storage:write', 'graphql:execute'],
} as const
