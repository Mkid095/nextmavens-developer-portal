/**
 * Authentication Request Handler
 *
 * Handles authentication for incoming HTTP requests.
 */

import { verifyAccessToken } from './tokens'
import { getDeveloperByEmail } from './database'

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
