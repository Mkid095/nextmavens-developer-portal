/**
 * POST /api/admin/projects/[id]/force
 *
 * Force Delete Project Power - Break Glass Mode
 *
 * This endpoint allows platform operators to immediately delete projects
 * without any grace period. This is a break glass power that requires
 * a valid break glass session token.
 *
 * US-006: Implement Force Delete Power
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/admin/projects/proj-123/force \
 *   -H "Authorization: Break-Glass session-uuid-456" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "reason": "Security incident - immediate removal required"
 *   }'
 * ```
 *
 * Note: While this is documented as POST, the endpoint performs a DELETE operation
 * internally. The POST method is used to allow including the reason and token in the
 * request body, which is more practical for break glass operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateBreakGlassToken,
  extractTokenFromBody,
} from '@/features/break-glass/lib/middleware';
import {
  forceDeleteProject,
  validateForceDeleteRequest,
} from '@/features/break-glass/lib/force-delete-project.service';
import type {
  ForceDeleteProjectRequest,
  ForceDeleteProjectResponse,
  ForceDeleteProjectError,
} from '@/features/break-glass/types/force-delete-project.types';

/**
 * POST /api/admin/projects/[id]/force
 *
 * Force delete a project immediately using break glass power.
 *
 * This endpoint:
 * - Requires a valid break glass session token
 * - Validates the session is not expired
 * - Deletes the project immediately (no grace period)
 * - Cleans up all associated resources if requested
 * - Logs the action with before/after states
 *
 * @param req - Next.js request
 * @param params - Route parameters containing project ID
 * @returns Force delete result with project state and action log
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/projects/proj-123/force', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': 'Break-Glass session-uuid-456',
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({
 *     reason: 'Security incident - immediate removal required',
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
    let body: Partial<ForceDeleteProjectRequest> = {};
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
        const errorResponse: ForceDeleteProjectError = {
          error: 'Invalid or expired break glass token',
          details: `A valid break glass session token is required. Reason: ${tokenValidation.reason}`,
          code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
        };
        return NextResponse.json(errorResponse, { status: 401 });
      }
      token = tokenValidation.session?.id ?? null;
    }

    if (!token) {
      const errorResponse: ForceDeleteProjectError = {
        error: 'Break glass token required',
        details: 'Provide break_glass_token in request body or Authorization header with "Break-Glass <token>"',
        code: 'INVALID_TOKEN',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Step 3: Validate the token
    const tokenValidation = await validateBreakGlassToken(req, token);
    if (!tokenValidation.valid) {
      const errorResponse: ForceDeleteProjectError = {
        error: 'Invalid or expired break glass token',
        details: `Reason: ${tokenValidation.reason}`,
        code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const adminId = tokenValidation.admin_id as string;
    const sessionId = tokenValidation.session?.id as string;

    // Step 4: Validate request parameters
    const validation = validateForceDeleteRequest({
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

    // Step 5: Perform force delete operation
    const result = await forceDeleteProject({
      projectId,
      sessionId,
      adminId,
      reason: body.reason,
      cleanupResources: body.cleanup_resources !== false, // Default true
    });

    // Step 6: Return success response
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[Force Delete Project API] Error:', error);

    // Check if it's a structured error from the service
    if (error instanceof Error) {
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.error && errorObj.code) {
          const errorResponse: ForceDeleteProjectError = errorObj;
          return NextResponse.json(errorResponse, {
            status:
              errorResponse.code === 'PROJECT_NOT_FOUND'
                ? 404
                : errorResponse.code === 'FORCE_DELETE_FAILED'
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
    const errorResponse: ForceDeleteProjectError = {
      error: 'Failed to force delete project',
      details: errorMessage,
      code: 'FORCE_DELETE_FAILED',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/admin/projects/[id]/force
 *
 * Get force delete history for a project.
 *
 * Returns all force delete operations that have been performed on this project.
 *
 * @param req - Next.js request
 * @param params - Route parameters containing project ID
 * @returns List of force delete actions for this project
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/projects/proj-123/force', {
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

    // Import getForceDeleteHistory dynamically to avoid circular dependency
    const { getForceDeleteHistory } = await import('@/features/break-glass/lib/force-delete-project.service');

    // Get force delete history
    const history = await getForceDeleteHistory(projectId);

    return NextResponse.json({
      project_id: projectId,
      force_delete_count: history.length,
      force_deletes: history,
    });
  } catch (error: unknown) {
    console.error('[Force Delete Project API] Get history error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to get force delete history',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/projects/[id]/force
 *
 * Alternative method for force delete using DELETE HTTP method.
 *
 * This is an alternative to the POST method that uses the standard DELETE HTTP method.
 * The break glass token must be provided via the Authorization header.
 *
 * @param req - Next.js request
 * @param params - Route parameters containing project ID
 * @returns Force delete result with project state and action log
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/projects/proj-123/force?reason=Security%20incident', {
 *   method: 'DELETE',
 *   headers: {
 *     'Authorization': 'Break-Glass session-uuid-456',
 *   },
 * });
 * ```
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Extract reason from query params
    const url = new URL(req.url);
    const reason = url.searchParams.get('reason') || undefined;
    const cleanupResources = url.searchParams.get('cleanup_resources') !== 'false';

    // Validate break glass token from headers
    const tokenValidation = await validateBreakGlassToken(req);
    if (!tokenValidation.valid) {
      const errorResponse: ForceDeleteProjectError = {
        error: 'Invalid or expired break glass token',
        details: `Reason: ${tokenValidation.reason}`,
        code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const adminId = tokenValidation.admin_id as string;
    const sessionId = tokenValidation.session?.id as string;

    // Validate request parameters
    const validation = validateForceDeleteRequest({
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

    // Perform force delete operation
    const result = await forceDeleteProject({
      projectId,
      sessionId,
      adminId,
      reason,
      cleanupResources,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[Force Delete Project API] Error:', error);

    // Check if it's a structured error from the service
    if (error instanceof Error) {
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.error && errorObj.code) {
          const errorResponse: ForceDeleteProjectError = errorObj;
          return NextResponse.json(errorResponse, {
            status:
              errorResponse.code === 'PROJECT_NOT_FOUND'
                ? 404
                : errorResponse.code === 'FORCE_DELETE_FAILED'
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
    const errorResponse: ForceDeleteProjectError = {
      error: 'Failed to force delete project',
      details: errorMessage,
      code: 'FORCE_DELETE_FAILED',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
