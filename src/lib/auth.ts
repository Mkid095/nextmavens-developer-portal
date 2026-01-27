import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'nextmavens-portal-secret'
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'nextmavens-refresh-secret'

export interface Developer {
  id: string
  email: string
  name: string
  organization?: string
}

export function generateAccessToken(developer: Developer): string {
  return jwt.sign(
    { id: developer.id, email: developer.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  )
}

export function generateRefreshToken(developerId: string): string {
  return jwt.sign(
    { id: developerId },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyAccessToken(token: string): Developer {
  try {
    return jwt.verify(token, JWT_SECRET) as Developer
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
