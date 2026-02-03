/**
 * Authentication Utilities
 */

import type { Developer } from './types'
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from './tokens'
import { checkProjectStatus as checkStatus } from './status'
import { getDeveloperByEmail } from './database'

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

export async function authenticateRequest(req: Request): Promise<{ payload: any; developer: any }> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
  }

  const token = authHeader.substring(7)
  const payload = verifyAccessToken(token)
  const developer = await getDeveloperByEmail(payload.email)

  return { payload, developer }
}

export function createDeveloperSession(developer: any, projectId: string): {
  accessToken: string
  refreshToken: string
  developer: any
} {
  const accessToken = generateAccessToken(developer, projectId)
  const refreshToken = generateRefreshToken(developer.id)

  return { accessToken, refreshToken, developer }
}
