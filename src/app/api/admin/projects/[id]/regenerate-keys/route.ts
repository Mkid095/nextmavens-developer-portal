/**
 * POST /api/admin/projects/[id]/regenerate-keys
 *
 * Regenerate System Keys Power - Break Glass Mode
 *
 * This endpoint allows platform operators to regenerate all system keys
 * for a project. This is a break glass power that requires a valid break
 * glass session token and is used for key compromise recovery.
 *
 * US-007: Implement Regenerate System Keys Power
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/admin/projects/proj-123/regenerate-keys \
 *   -H "Authorization: Break-Glass session-uuid-456" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "reason": "Key compromise suspected - rotating all keys",
 *     "key_count": 2,
 *     "environment": "live"
 *   }'
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateBreakGlassToken,
  extractTokenFromBody,
} from '@/features/break-glass/lib/middleware';
import {
  regenerateKeys,
  validateRegenerateKeysRequest,
} from '@/features/break-glass/lib/regenerate-keys.service';
import type {
  RegenerateKeysRequest,
  RegenerateKeysResponse,
  RegenerateKeysError,
} from '@/features/break-glass/types/regenerate-keys.types';

/**
 * POST /api/admin/projects/[id]/regenerate-keys
 *
 * Regenerate all system keys for a project using break glass power.
 *
 * This endpoint:
 * - Requires a valid break glass session token
 * - Validates the session is not expired
 * - Invalidates all existing API keys
 * - Generates new service_role keys
 * - Logs the action with before/after states
 * - Returns new keys (show once - will not be retrievable again)
 *
 * @param req - Next.js request
 * @param params - Route parameters containing project ID
 * @returns Regenerate result with new keys and action log
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/projects/proj-123/regenerate-keys', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': 'Break-Glass session-uuid-456',
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({
 *     reason: 'Key compromise - rotating all keys',
 *     key_count: 2,
 *   }),
 * });
 *
 * const { keys_state, action_log } = await response.json();
 * // Save the new keys now - they won't be shown again!
 * console.log('New keys:', keys_state.new_service_role_keys);
 * ```
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Step 1: Parse request body
    let body: Partial<RegenerateKeysRequest> = {};
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
        const errorResponse: RegenerateKeysError = {
          error: 'Invalid or expired break glass token',
          details: `A valid break glass session token is required. Reason: ${tokenValidation.reason}`,
          code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
        };
        return NextResponse.json(errorResponse, { status: 401 });
      }
      token = tokenValidation.session?.id;
    }

    if (!token) {
      const errorResponse: RegenerateKeysError = {
        error: 'Break glass token required',
        details:
          'Provide break_glass_token in request body or Authorization header with "Break-Glass <token>"',
        code: 'INVALID_TOKEN',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Step 3: Validate the token
    const tokenValidation = await validateBreakGlassToken(req, token);
    if (!tokenValidation.valid) {
      const errorResponse: RegenerateKeysError = {
        error: 'Invalid or expired break glass token',
        details: `Reason: ${tokenValidation.reason}`,
        code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const adminId = tokenValidation.admin_id as string;
    const sessionId = tokenValidation.session?.id as string;

    // Step 4: Validate request parameters
    const validation = validateRegenerateKeysRequest({
      projectId,
      sessionId,
      adminId,
      keyCount: body.key_count,
      environment: body.environment,
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

    // Step 5: Perform regenerate keys operation
    const result = await regenerateKeys({
      projectId,
      sessionId,
      adminId,
      reason: body.reason,
      invalidateAll: body.invalidate_all !== false, // Default true
      keyCount: body.key_count || 1,
      environment: body.environment || 'live',
    });

    // Step 6: Return success response
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[Regenerate Keys API] Error:', error);

    // Check if it's a structured error from the service
    if (error instanceof Error) {
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.error && errorObj.code) {
          const errorResponse: RegenerateKeysError = errorObj;
          return NextResponse.json(errorResponse, {
            status:
              errorResponse.code === 'PROJECT_NOT_FOUND'
                ? 404
                : errorResponse.code === 'REGENERATE_FAILED'
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
    const errorResponse: RegenerateKeysError = {
      error: 'Failed to regenerate keys',
      details: errorMessage,
      code: 'REGENERATE_FAILED',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/admin/projects/[id]/regenerate-keys
 *
 * Get regenerate keys history for a project.
 *
 * Returns all key regeneration operations that have been performed on this project.
 *
 * @param req - Next.js request
 * @param params - Route parameters containing project ID
 * @returns List of regenerate keys actions for this project
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/projects/proj-123/regenerate-keys', {
 *   method: 'GET',
 *   headers: {
 *     'Authorization': 'Break-Glass session-uuid-456',
 *   },
 * });
 *
 * const { project_id, regenerate_count, regenerations } = await response.json();
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

    // Import getRegenerateKeysHistory dynamically to avoid circular dependency
    const { getRegenerateKeysHistory } = await import(
      '@/features/break-glass/lib/regenerate-keys.service'
    );

    // Get regenerate keys history
    const history = await getRegenerateKeysHistory(projectId);

    return NextResponse.json({
      project_id: projectId,
      regenerate_count: history.length,
      regenerations: history,
    });
  } catch (error: unknown) {
    console.error('[Regenerate Keys API] Get history error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to get regenerate keys history',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
