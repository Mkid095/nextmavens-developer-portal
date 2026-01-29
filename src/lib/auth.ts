import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { getPool } from './db'

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

export function generateAccessToken(developer: Developer): string {
  return jwt.sign(
    { id: developer.id, email: developer.email },
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

export function verifyAccessToken(token: string): Developer {
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    if (typeof decoded === 'string') {
      throw new Error('Invalid token format')
    }
    // Ensure the decoded token has the required properties
    if (!decoded.id || !decoded.email) {
      throw new Error('Invalid token structure')
    }
    return decoded as unknown as Developer
  } catch {
    throw new Error('Invalid token')
  }
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

export function generateApiKey(type: 'public' | 'secret' = 'public'): string {
  const prefix = type === 'public' ? 'nm_live_pk_' : 'nm_live_sk_'
  const key = Buffer.from(crypto.randomBytes(32)).toString('hex')
  return `${prefix}${key}`
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function authenticateRequest(req: NextRequest): Promise<Developer> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
  }
  const token = authHeader.substring(7)
  return verifyAccessToken(token)
}

/**
 * API Key interface for authentication result
 */
export interface ApiKeyAuth {
  id: string
  project_id: string
  developer_id: string
  key_type: string
  key_prefix: string
  scopes: string[]
  environment: string
  name: string
  created_at: string
}

/**
 * Authenticate an API key and return the key details with developer info.
 * Updates last_used and usage_count asynchronously after successful authentication.
 *
 * US-004: Update Key Usage on Each Request
 *
 * @param apiKey - The raw API key from the request (e.g., from x-api-key header)
 * @returns The API key details with developer_id
 * @throws Error if the key is invalid, expired, or revoked
 */
export async function authenticateApiKey(apiKey: string): Promise<ApiKeyAuth> {
  const pool = getPool()
  const hashedKey = hashApiKey(apiKey)

  // Query for the API key with developer ownership
  const result = await pool.query(
    `SELECT ak.id, ak.project_id, p.developer_id, ak.key_type, ak.key_prefix,
            ak.scopes, ak.environment, ak.name, ak.created_at, ak.status, ak.expires_at
     FROM api_keys ak
     JOIN projects p ON ak.project_id = p.id
     WHERE ak.key_hash = $1`,
    [hashedKey]
  )

  if (result.rows.length === 0) {
    throw new Error('Invalid API key')
  }

  const key = result.rows[0]

  // Check if key is revoked
  if (key.status === 'revoked') {
    throw new Error('API key has been revoked')
  }

  // Check if key is expired
  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    throw new Error('API key has expired')
  }

  // Update last_used and usage_count asynchronously (fire and forget)
  // This ensures we don't block the request waiting for the update
  updateKeyUsage(key.id).catch(error => {
    console.error('[Auth] Failed to update key usage:', error)
  })

  return {
    id: key.id,
    project_id: key.project_id,
    developer_id: key.developer_id,
    key_type: key.key_type,
    key_prefix: key.key_prefix,
    scopes: key.scopes || [],
    environment: key.environment,
    name: key.name || key.key_type + ' key',
    created_at: key.created_at,
  }
}

/**
 * Update key usage statistics (last_used timestamp and usage_count).
 * This is called asynchronously after successful authentication.
 *
 * @param keyId - The ID of the API key to update
 */
async function updateKeyUsage(keyId: string): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `UPDATE api_keys
       SET last_used = NOW(),
           usage_count = COALESCE(usage_count, 0) + 1
       WHERE id = $1`,
      [keyId]
    )
  } catch (error) {
    console.error(`[Auth] Failed to update usage for key ${keyId}:`, error)
    throw error
  }
}
