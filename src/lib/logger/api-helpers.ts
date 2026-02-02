/**
 * API Logging Helpers
 *
 * Helper functions for logging API requests and responses with
 * environment-aware verbosity.
 */

import { getCurrentLogLevel } from './config'
import { logRequest, logResponse, logError } from '../logger'

/**
 * Helper function to log API request with environment-aware verbosity
 * Call this at the start of your API route handler
 *
 * @param req - Next.js request object
 * @param projectId - Optional project ID to fetch environment for
 */
export async function logApiRequest(
  req: Request,
  projectId?: string
): Promise<void> {
  const url = new URL(req.url)
  const method = req.method

  // Clone request to read body without consuming it
  let body: unknown = undefined
  const contentType = req.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    try {
      const clonedReq = req.clone()
      body = await clonedReq.json()
    } catch {
      // Body not readable or not JSON
    }
  }

  // Get headers as object
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })

  logRequest(method, url.pathname, undefined, body, headers)
}

/**
 * Helper function to log API response with environment-aware verbosity
 * Call this before returning from your API route handler
 *
 * @param req - Next.js request object
 * @param response - Response object
 * @param duration - Request duration in milliseconds
 */
export function logApiResponse(
  req: Request,
  response: Response,
  duration: number
): void {
  const url = new URL(req.url)
  const method = req.method
  const status = response.status

  // Try to get response body
  const contentType = response.headers.get('content-type')

  if (getCurrentLogLevel() === 'debug' && contentType?.includes('application/json')) {
    // Note: We can't read the response body without consuming it
    // This is a limitation of the Response API
    // Callers can optionally pass response body if they have it
  }

  logResponse(method, url.pathname, status, { duration }, undefined, duration)
}

/**
 * Higher-order function to wrap API route handlers with logging
 * Automatically logs request and response with environment-aware verbosity
 *
 * @param handler - The API route handler to wrap
 * @returns A wrapped handler with automatic logging
 *
 * @example
 * ```ts
 * import { withLogging } from '@/lib/logger'
 * import { NextRequest } from 'next/server'
 *
 * export const POST = withLogging(async (req: NextRequest) => {
 *   // Your handler logic here
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */
export function withLogging<T extends Request>(
  handler: (req: T) => Promise<Response> | Response
): (req: T) => Promise<Response> {
  return async (req: T): Promise<Response> => {
    const startTime = Date.now()

    // Log incoming request
    await logApiRequest(req)

    try {
      // Call the actual handler
      const response = await handler(req)
      const duration = Date.now() - startTime

      // Log outgoing response
      logApiResponse(req, response, duration)

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // Log error
      logError(error, `Request failed: ${req.method} ${new URL(req.url).pathname}`)

      throw error
    }
  }
}
