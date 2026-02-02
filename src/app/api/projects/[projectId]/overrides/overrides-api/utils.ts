/**
 * Project Overrides API - Utility Functions
 *
 * Shared utility functions for override operations.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  logAuthFailure,
  logValidationFailure,
  extractClientIP,
} from '@/features/abuse-controls/lib/audit-logger'
import { AuthorizationError } from '@/features/abuse-controls/lib/authorization'
import { projectIdSchema } from '@/features/abuse-controls/lib/validation'

/**
 * Validate project ID and log validation failures
 */
export async function validateProjectId(
  projectId: string,
  action: string,
  clientIP: string
): Promise<NextResponse | null> {
  const validation = projectIdSchema.safeParse(projectId)
  if (!validation.success) {
    await logValidationFailure(
      action,
      'Invalid project ID',
      { projectId, errors: validation.error.issues }
    )
    return NextResponse.json(
      {
        error: 'Invalid project ID',
        details: validation.error.issues,
      },
      { status: 400 }
    )
  }
  return null
}

/**
 * Handle authentication errors with logging
 */
export async function handleAuthError(
  error: unknown,
  action: string,
  projectId: string,
  clientIP: string
): Promise<NextResponse | null> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const errorName = error instanceof Error ? error.name : 'Error'

  // Log authentication failures
  if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
    await logAuthFailure(
      null,
      action,
      errorMessage,
      projectId,
      clientIP
    )
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Log authorization failures
  if (errorName === 'AuthorizationError') {
    const authError = error as Error & { developerId?: string; statusCode?: number }
    await logAuthFailure(
      authError.developerId || null,
      action,
      errorMessage,
      projectId,
      clientIP
    )
    return NextResponse.json(
      { error: errorMessage },
      { status: authError.statusCode || 403 }
    )
  }

  return null
}

/**
 * Get request context
 */
export function getRequestContext(req: NextRequest) {
  return {
    clientIP: extractClientIP(req),
    userAgent: req.headers.get('user-agent'),
  }
}
