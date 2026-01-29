/**
 * API Route: List Users
 * GET /api/auth/users - List all users with optional filtering
 *
 * SECURITY: Requires operator or admin role
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateRequest } from '@/lib/auth'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { authServiceClient } from '@/lib/api/auth-service-client'
import type { EndUserListQuery } from '@/lib/types/auth-user.types'

/**
 * Query parameter validation schema
 * Enforces security constraints on user list queries
 */
const userListQuerySchema = z.object({
  limit: z.coerce
    .number({
      message: 'Limit must be a number',
    })
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(50, 'Limit cannot exceed 50')
    .default(50)
    .optional(),
  offset: z.coerce
    .number({
      message: 'Offset must be a number',
    })
    .int('Offset must be an integer')
    .nonnegative('Offset cannot be negative')
    .default(0)
    .optional(),
  search: z
    .string()
    .max(100, 'Search term cannot exceed 100 characters')
    .trim()
    .optional(),
  status: z.enum(['active', 'disabled', 'deleted'], {
    message: 'Invalid status value',
  })
    .optional(),
  auth_provider: z.enum(['email', 'google', 'github', 'microsoft'], {
    message: 'Invalid auth provider',
  })
    .optional(),
  created_after: z
    .string()
    .datetime('Invalid datetime format for created_after')
    .optional(),
  created_before: z
    .string()
    .datetime('Invalid datetime format for created_before')
    .optional(),
  last_sign_in_after: z
    .string()
    .datetime('Invalid datetime format for last_sign_in_after')
    .optional(),
  last_sign_in_before: z
    .string()
    .datetime('Invalid datetime format for last_sign_in_before')
    .optional(),
  sort_by: z.enum(['created_at', 'last_sign_in_at', 'email', 'name'], {
    message: 'Invalid sort field',
  })
    .optional(),
  sort_order: z.enum(['asc', 'desc'], {
    message: 'Sort order must be asc or desc',
  })
    .optional(),
})

export async function GET(req: NextRequest) {
  try {
    // Authenticate the request
    const developer = await authenticateRequest(req)

    // Authorize - only operators and admins can view all users
    await requireOperatorOrAdmin(developer)

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validate input using Zod schema
    const validatedQuery = userListQuerySchema.parse(queryParams)

    // Build query object (undefined values will be omitted)
    const query: EndUserListQuery = {
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
      search: validatedQuery.search,
      status: validatedQuery.status,
      auth_provider: validatedQuery.auth_provider,
      created_after: validatedQuery.created_after,
      created_before: validatedQuery.created_before,
      last_sign_in_after: validatedQuery.last_sign_in_after,
      last_sign_in_before: validatedQuery.last_sign_in_before,
      sort_by: validatedQuery.sort_by,
      sort_order: validatedQuery.sort_order,
    }

    // Call auth service
    const response = await authServiceClient.listEndUsers(query)

    return NextResponse.json(response)
  } catch (error) {
    // Generic error handling to prevent information leakage
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    // Log security-relevant errors for monitoring
    console.error('[Security] Error listing users:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    // Generic unauthorized message (don't reveal if token exists)
    if (error instanceof Error && (
      error.message === 'No token provided' ||
      error.message === 'Invalid token' ||
      error.name === 'AuthorizationError'
    )) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to list users' },
      { status: 500 }
    )
  }
}
