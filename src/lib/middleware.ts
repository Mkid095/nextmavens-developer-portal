import { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'

export async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
  }

  const token = authHeader.substring(7)
  return verifyAccessToken(token)
}
