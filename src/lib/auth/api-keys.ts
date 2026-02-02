/**
 * API Key Management
 */

import crypto from 'crypto'

export function generateApiKey(type: 'public' | 'secret' = 'public'): string {
  const key = Buffer.from(crypto.randomBytes(32)).toString('hex')
  return key
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}
