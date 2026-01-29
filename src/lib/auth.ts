import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { NextRequest } from 'next/server'

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
