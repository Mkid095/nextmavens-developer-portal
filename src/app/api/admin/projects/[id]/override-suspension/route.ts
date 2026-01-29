/**
 * POST /api/admin/projects/[id]/override-suspension
 *
 * Override Suspension Power - Break Glass Mode
 *
 * This endpoint allows platform operators to override auto-suspension
 * and optionally increase hard caps for legitimate high-usage projects.
 * This is a break glass power that requires a valid break glass session token.
 *
 * US-005: Implement Override Suspension Power
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/admin/projects/proj-123/override-suspension \
 *   -H "Authorization: Break-Glass session-uuid-456" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "reason": "Legitimate high-usage project - verified with customer",
 *     "new_hard_caps": [
 *       { "type": "db_queries_per_day", "value": 50000 },
 *       { "type": "storage_uploads_per_day", "value": 5000 }
 *     ]
 *   }'
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateBreakGlassToken,
  extractTokenFromBody,
} from '@/features/break-glass/lib/middleware';
import {
  overrideSuspension,
  validateOverrideRequest,
} from '@/features/break-glass/lib/override-suspension.service';
import type {
  OverrideSuspensionRequest,
  OverrideSuspensionResponse,
  OverrideSuspensionError,
} from '@/features/break-glass/types/override-suspension.types';

/**
 * POST /api/admin/projects/[id]/override-suspension
 *
 * Override a project's suspension and optionally increase hard caps.
 *
 * This endpoint:
 * - Requires a valid break glass session token
 * - Validates the session is not expired
 * - Clears suspension flags if requested
 * - Optionally increases hard caps
 * - Logs the action with before/after states
 *
 * @param req - Next.js request
 * @param params - Route parameters containing project ID
 * @returns Override result with project state and action log
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/projects/proj-123/override-suspension', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': 'Break-Glass session-uuid-456',
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({
 *     reason: 'Legitimate high-usage project - verified with customer',
 *     new_hard_caps: [
 *       { type: 'db_queries_per_day', value: 50000 },
 *     ],
 *   }),
 * });
 * ```
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Step 1: Parse request body
    let body: Partial<OverrideSuspensionRequest> = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional, continue with empty object
    }

    // Step 2: Extract and validate break glass token
    let token = extractTokenFromBody(body);

    // If not in body, try headers/query params
    if (!token) {
      const tokenValidation = await validateBreakGlassToken(req);
      if (!tokenValidation.valid) {
        const errorResponse: OverrideSuspensionError = {
          error: 'Invalid or expired break glass token',
          details: `A valid break glass session token is required. Reason: ${tokenValidation.reason}`,
          code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
        };
        return NextResponse.json(errorResponse, { status: 401 });
      }
      token = tokenValidation.session?.id;
    }

    if (!token) {
      const errorResponse: OverrideSuspensionError = {
        error: 'Break glass token required',
        details: 'Provide break_glass_token in request body or Authorization header with "Break-Glass <token>"',
        code: 'INVALID_TOKEN',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Step 3: Validate the token
    const tokenValidation = await validateBreakGlassToken(req, token);
    if (!tokenValidation.valid) {
      const errorResponse: OverrideSuspensionError = {
        error: 'Invalid or expired break glass token',
        details: `Reason: ${tokenValidation.reason}`,
        code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const adminId = tokenValidation.admin_id as string;
    const sessionId = tokenValidation.session?.id as string;

    // Step 4: Validate request parameters
    const validation = validateOverrideRequest({
      projectId,
      sessionId,
      adminId,
      newHardCaps: body.new_hard_caps,
      increaseCapsByPercent: body.increase_caps_by_percent,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validation.errors?.map((e) => `${e.field}: ${e.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    // Step 5: Perform override operation
    const result = await overrideSuspension({
      projectId,
      sessionId,
      adminId,
      reason: body.reason,
      clearSuspensionFlags: body.clear_suspension_flags !== false, // Default true
      newHardCaps: body.new_hard_caps,
      increaseCapsByPercent: body.increase_caps_by_percent,
    });

    // Step 6: Return success response
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[Override Suspension API] Error:', error);

    // Check if it's a structured error from the service
    if (error instanceof Error) {
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.error && errorObj.code) {
          const errorResponse: OverrideSuspensionError = errorObj;
          return NextResponse.json(errorResponse, {
            status:
              errorResponse.code === 'PROJECT_NOT_FOUND'
                ? 404
                : errorResponse.code === 'OVERRIDE_FAILED'
                ? 500
                : 500,
          });
        }
      } catch {
        // Not a JSON error, continue with generic error handling
      }
    }

    // Generic error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse: OverrideSuspensionError = {
      error: 'Failed to override suspension',
      details: errorMessage,
      code: 'OVERRIDE_FAILED',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/admin/projects/[id]/override-suspension
 *
 * Get override suspension history for a project.
 *
 * Returns all override suspension operations that have been performed on this project.
 *
 * @param req - Next.js request
 * @param params - Route parameters containing project ID
 * @returns List of override actions for this project
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/projects/proj-123/override-suspension', {
 *   method: 'GET',
 *   headers: {
 *     'Authorization': 'Break-Glass session-uuid-456',
 *   },
 * });
 * ```
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Validate break glass token
    const tokenValidation = await validateBreakGlassToken(req);
    if (!tokenValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid or expired break glass token',
          code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
        },
        { status: 401 }
      );
    }

    // Import getOverrideHistory dynamically to avoid circular dependency
    const { getOverrideHistory } = await import('@/features/break-glass/lib/override-suspension.service');

    // Get override history
    const history = await getOverrideHistory(projectId);

    return NextResponse.json({
      project_id: projectId,
      override_count: history.length,
      overrides: history,
    });
  } catch (error: unknown) {
    console.error('[Override Suspension API] Get history error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to get override history',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
