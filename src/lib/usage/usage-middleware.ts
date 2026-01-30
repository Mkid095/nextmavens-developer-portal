/**
 * Usage Tracking Middleware
 *
 * Middleware wrapper that tracks database usage metrics for API requests.
 * Integrates with existing authentication middleware to extract project_id
 * from JWT and record usage metrics asynchronously.
 *
 * US-002 from prd-usage-tracking.json:
 * - API gateway logs db_query count
 * - Logs db_row_read count
 * - Logs db_row_written count
 * - Records to usage_metrics table
 * - Async to not block requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { trackDatabaseQuery } from './database-tracking'
import { verifyAccessToken, type JwtPayload } from '@/lib/auth'

export type ApiHandler = (req: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse>

export interface UsageTrackingOptions {
  /**
   * Estimate rows read for this request.
   * Can be a number or a function that extracts from request.
   */
  estimateRowsRead?: number | ((req: NextRequest) => number | Promise<number>)

  /**
   * Estimate rows written for this request.
   * Can be a number or a function that extracts from request.
   */
  estimateRowsWritten?: number | ((req: NextRequest) => number | Promise<number>)
}

/**
 * Wrap an API handler with usage tracking.
 *
 * Extracts project_id from JWT token and tracks database usage metrics
 * asynchronously (fire-and-forget) to avoid blocking requests.
 *
 * @param handler - The API route handler to wrap
 * @param options - Optional usage tracking configuration
 * @returns Wrapped handler that tracks database usage
 *
 * @example
 * ```ts
 * export const GET = withUsageTracking(async (req) => {
 *   // Your handler code
 *   return NextResponse.json({ data: 'hello' })
 * })
 * ```
 *
 * @example
 * ```ts
 * // With custom row estimates
 * export const POST = withUsageTracking(
 *   async (req) => {
 *     const body = await req.json()
 *     // Your handler code
 *     return NextResponse.json({ success: true })
 *   },
 *   {
 *     estimateRowsRead: (req) => {
 *       // Estimate based on request
 *       return 10
 *     },
 *     estimateRowsWritten: (req) => {
 *       const body = await req.json()
 *       return body.items?.length || 0
 *     }
 *   }
 * )
 * ```
 */
export function withUsageTracking(
  handler: ApiHandler,
  options: UsageTrackingOptions = {}
): ApiHandler {
  return async (req: NextRequest, context?: { params: Record<string, string> }) => {
    // Extract project_id from JWT for usage tracking
    let projectId: string | null = null

    try {
      const authHeader = req.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const payload = verifyAccessToken(token)
        projectId = payload.project_id
      }
    } catch (error) {
      // If authentication fails, we still let the request proceed
      // The handler will handle authentication errors
      // We just can't track usage without a project_id
    }

    // Execute the handler
    const response = await handler(req, context)

    // Track usage asynchronously (fire and forget)
    // Only track if we have a project_id and the request succeeded
    if (projectId && response.status >= 200 && response.status < 300) {
      trackUsageAsync(projectId, req, response, options).catch(err => {
        // Silent fail - errors are logged in trackUsageAsync
        console.error('[UsageTracking] Unexpected error:', err)
      })
    }

    return response
  }
}

/**
 * Track usage metrics asynchronously.
 *
 * This function is designed to be called in a fire-and-forget manner
 * to avoid blocking the API response.
 *
 * @param projectId - The project ID from JWT
 * @param req - The Next.js request object
 * @param response - The response object
 * @param options - Usage tracking options
 */
async function trackUsageAsync(
  projectId: string,
  req: NextRequest,
  response: NextResponse,
  options: UsageTrackingOptions
): Promise<void> {
  try {
    // Get row estimates
    let rowsRead = 0
    let rowsWritten = 0

    if (options.estimateRowsRead) {
      if (typeof options.estimateRowsRead === 'number') {
        rowsRead = options.estimateRowsRead
      } else {
        rowsRead = await options.estimateRowsRead(req)
      }
    }

    if (options.estimateRowsWritten) {
      if (typeof options.estimateRowsWritten === 'number') {
        rowsWritten = options.estimateRowsWritten
      } else {
        rowsWritten = await options.estimateRowsWritten(req)
      }
    }

    // Default: every API request is at least 1 db_query
    // This is a simplified estimation - in production, you'd have
    // more sophisticated tracking at the query level
    const queryCount = 1

    // Track the usage
    trackDatabaseQuery(projectId, rowsRead, rowsWritten)

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[UsageTracking] Tracked usage for project ${projectId}:`, {
        queryCount,
        rowsRead,
        rowsWritten,
        path: req.nextUrl.pathname,
        method: req.method,
      })
    }
  } catch (error: any) {
    // Don't throw - this is async fire-and-forget
    console.error('[UsageTracking] Error tracking usage:', {
      projectId,
      error: error.message,
      path: req.nextUrl.pathname,
    })
  }
}

/**
 * Wrap an API handler with usage tracking and custom row estimation.
 *
 * This variant allows you to estimate rows based on the response body
 * or other request/response characteristics.
 *
 * @param handler - The API route handler to wrap
 * @param rowEstimator - Function to estimate rows from request/response
 * @returns Wrapped handler with custom row estimation
 *
 * @example
 * ```ts
 * export const GET = withUsageTrackingCustom(async (req) => {
 *   // Your handler
 *   return NextResponse.json({ items: [...] })
 * }, async (req, response) => {
 *   // Estimate rows based on response
 *   const body = await response.json()
 *   return {
 *     rowsRead: body.items?.length || 0,
 *     rowsWritten: 0
 *   }
 * })
 * ```
 */
export function withUsageTrackingCustom(
  handler: ApiHandler,
  rowEstimator: (req: NextRequest, response: NextResponse) => {
    rowsRead: number | Promise<number>
    rowsWritten: number | Promise<number>
  }
): ApiHandler {
  return async (req: NextRequest, context?: { params: Record<string, string> }) => {
    // Extract project_id from JWT for usage tracking
    let projectId: string | null = null

    try {
      const authHeader = req.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const payload = verifyAccessToken(token)
        projectId = payload.project_id
      }
    } catch (error) {
      // Continue without tracking if auth fails
    }

    // Execute the handler
    const response = await handler(req, context)

    // Track usage with custom estimator
    if (projectId && response.status >= 200 && response.status < 300) {
      trackUsageWithEstimatorAsync(projectId, req, response, rowEstimator).catch(err => {
        console.error('[UsageTracking] Unexpected error:', err)
      })
    }

    return response
  }
}

/**
 * Track usage with custom estimator asynchronously.
 */
async function trackUsageWithEstimatorAsync(
  projectId: string,
  req: NextRequest,
  response: NextResponse,
  estimator: (req: NextRequest, response: NextResponse) => {
    rowsRead: number | Promise<number>
    rowsWritten: number | Promise<number>
  }
): Promise<void> {
  try {
    const estimates = await estimator(req, response)
    const rowsRead = await estimates.rowsRead
    const rowsWritten = await estimates.rowsWritten

    trackDatabaseQuery(projectId, rowsRead, rowsWritten)
  } catch (error: any) {
    console.error('[UsageTracking] Error tracking usage with estimator:', {
      projectId,
      error: error.message,
    })
  }
}
