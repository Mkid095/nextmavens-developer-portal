/**
 * POST /api/admin/projects/[id]/unlock
 *
 * Unlock Project Power - Break Glass Mode
 *
 * This endpoint allows platform operators to unlock suspended projects
 * regardless of the suspension reason. This is a break glass power that
 * requires a valid break glass session token.
 *
 * US-004: Implement Unlock Project Power
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/admin/projects/proj-123/unlock \
 *   -H "Authorization: Break-Glass session-uuid-456" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "reason": "False positive suspension - verified with customer"
 *   }'
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateBreakGlassToken,
  extractTokenFromBody,
} from '@/features/break-glass/lib/middleware';
import {
  unlockProject,
  validateUnlockRequest,
} from '@/features/break-glass/lib/unlock-project.service';
import type {
  UnlockProjectRequest,
  UnlockProjectResponse,
  UnlockProjectError,
} from '@/features/break-glass/types/unlock-project.types';

/**
 * POST /api/admin/projects/[id]/unlock
 *
 * Unlock a suspended project using break glass power.
 *
 * This endpoint:
 * - Requires a valid break glass session token
 * - Validates the session is not expired
 * - Clears suspension flags
 * - Sets project status to ACTIVE
 * - Logs the action with before/after states
 *
 * @param req - Next.js request
 * @param params - Route parameters containing project ID
 * @returns Unlock result with project state and action log
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/projects/proj-123/unlock', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': 'Break-Glass session-uuid-456',
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({
 *     reason: 'False positive - customer verified',
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
    let body: Partial<UnlockProjectRequest> = {};
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
        const errorResponse: UnlockProjectError = {
          error: 'Invalid or expired break glass token',
          details: `A valid break glass session token is required. Reason: ${tokenValidation.reason}`,
          code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
        };
        return NextResponse.json(errorResponse, { status: 401 });
      }
      token = tokenValidation.session?.id;
    }

    if (!token) {
      const errorResponse: UnlockProjectError = {
        error: 'Break glass token required',
        details: 'Provide break_glass_token in request body or Authorization header with "Break-Glass <token>"',
        code: 'INVALID_TOKEN',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Step 3: Validate the token
    const tokenValidation = await validateBreakGlassToken(req, token);
    if (!tokenValidation.valid) {
      const errorResponse: UnlockProjectError = {
        error: 'Invalid or expired break glass token',
        details: `Reason: ${tokenValidation.reason}`,
        code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const adminId = tokenValidation.admin_id as string;
    const sessionId = tokenValidation.session?.id as string;

    // Step 4: Validate request parameters
    const validation = validateUnlockRequest({
      projectId,
      sessionId,
      adminId,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Step 5: Perform unlock operation
    const result = await unlockProject({
      projectId,
      sessionId,
      adminId,
      reason: body.reason,
      clearSuspensionFlags: body.clear_suspension_flags !== false, // Default true
    });

    // Step 6: Return success response
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[Unlock Project API] Error:', error);

    // Check if it's a structured error from the service
    if (error instanceof Error) {
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.error && errorObj.code) {
          const errorResponse: UnlockProjectError = errorObj;
          return NextResponse.json(errorResponse, {
            status:
              errorResponse.code === 'PROJECT_NOT_FOUND'
                ? 404
                : errorResponse.code === 'UNLOCK_FAILED'
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
    const errorResponse: UnlockProjectError = {
      error: 'Failed to unlock project',
      details: errorMessage,
      code: 'UNLOCK_FAILED',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/admin/projects/[id]/unlock
 *
 * Get unlock history for a project.
 *
 * Returns all unlock operations that have been performed on this project.
 *
 * @param req - Next.js request
 * @param params - Route parameters containing project ID
 * @returns List of unlock actions for this project
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/projects/proj-123/unlock', {
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

    // Import getUnlockHistory dynamically to avoid circular dependency
    const { getUnlockHistory } = await import('@/features/break-glass/lib/unlock-project.service');

    // Get unlock history
    const history = await getUnlockHistory(projectId);

    return NextResponse.json({
      project_id: projectId,
      unlock_count: history.length,
      unlocks: history,
    });
  } catch (error: unknown) {
    console.error('[Unlock Project API] Get history error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to get unlock history',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
