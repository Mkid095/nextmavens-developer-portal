/**
 * PATCH /api/admin/feature-flags/[name]
 *
 * Update a feature flag (admin only)
 *
 * Updates the enabled state of a specific feature flag.
 * Requires admin or operator role.
 *
 * US-008: Create Admin Feature Flag UI
 * US-010: Audit Feature Flag Changes
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, type Developer } from '@/lib/auth'
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization'
import { setFeatureFlag, type FeatureFlagScope } from '@/lib/features'
import {
  logFeatureFlagEnabled,
  logFeatureFlagDisabled,
  extractClientIP,
  extractUserAgent,
} from '@/features/abuse-controls/lib/audit-logger'

interface UpdateFlagRequest {
  enabled: boolean
  scope?: FeatureFlagScope
  scopeId?: string
  metadata?: Record<string, unknown>
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    // Authenticate the request
    const jwtPayload = await authenticateRequest(req)

    // Convert JwtPayload to Developer for authorization
    const developer: Developer = {
      id: jwtPayload.id,
      email: jwtPayload.email,
      name: '', // Name not available in JWT payload
    }

    // Authorize - only operators and admins can update feature flags
    await requireOperatorOrAdmin(developer)

    const flagName = params.name

    // Parse request body
    const body: UpdateFlagRequest = await req.json()

    // Validate enabled field
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          details: 'enabled field must be a boolean',
        },
        { status: 400 }
      )
    }

    // Update the feature flag and get the old value
    const oldValue = await setFeatureFlag(
      flagName,
      body.enabled,
      body.scope || 'global',
      body.scopeId,
      body.metadata
    )

    // Log the change to audit logs
    // Only log if the value actually changed
    if (oldValue !== null && oldValue !== body.enabled) {
      const ipAddress = extractClientIP(req)
      const userAgent = extractUserAgent(req)
      const scope = body.scope || 'global'

      if (body.enabled) {
        await logFeatureFlagEnabled(
          flagName,
          developer.id,
          oldValue,
          scope,
          body.scopeId,
          ipAddress,
          userAgent
        )
      } else {
        await logFeatureFlagDisabled(
          flagName,
          developer.id,
          oldValue,
          scope,
          body.scopeId,
          ipAddress,
          userAgent
        )
      }
    }

    return NextResponse.json({
      success: true,
      flag: {
        name: flagName,
        enabled: body.enabled,
        scope: body.scope || 'global',
      },
    })
  } catch (error: unknown) {
    console.error('[Feature Flags] Error updating flag:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to update feature flag'

    // Handle authentication errors
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }

    // Handle authorization errors
    if (
      errorMessage.includes('operator or administrator') ||
      errorMessage.includes('administrator privileges')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient privileges',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update feature flag',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
