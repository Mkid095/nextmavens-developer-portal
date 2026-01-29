/**
 * GET /api/admin/projects/[id]
 *
 * Access Project Power - Break Glass Mode
 *
 * This endpoint allows platform operators to access ANY project details,
 * bypassing normal ownership checks for investigation purposes.
 * This is a break glass power that requires a valid break glass session token.
 *
 * US-008: Implement Access Any Project Power
 *
 * @example
 * ```bash
 * curl -X GET http://localhost:3000/api/admin/projects/proj-123 \
 *   -H "Authorization: Break-Glass session-uuid-456"
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateBreakGlassToken,
  extractTokenFromBody,
} from '@/features/break-glass/lib/middleware';
import {
  accessProject,
  getAccessHistory,
  validateAccessRequest,
} from '@/features/break-glass/lib/access-project.service';
import type {
  AccessProjectResponse,
  AccessProjectError,
  AccessHistoryResponse,
} from '@/features/break-glass/types/access-project.types';

/**
 * GET /api/admin/projects/[id]
 *
 * Access full project details using break glass power.
 * This bypasses normal ownership checks - allows accessing ANY project.
 *
 * This endpoint:
 * - Requires a valid break glass session token
 * - Validates the session is not expired
 * - Returns full project details (owner, suspension, caps, keys count, etc.)
 * - Logs the access with full context (IP, user agent, etc.)
 *
 * This is a READ-ONLY operation - no modifications are made.
 *
 * @param req - Next.js request
 * @param params - Route parameters containing project ID
 * @returns Full project details with access log
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/projects/proj-123', {
 *   method: 'GET',
 *   headers: {
 *     'Authorization': 'Break-Glass session-uuid-456',
 *   },
 * });
 * const data = await response.json();
 * console.log('Project owner:', data.project.developer_id);
 * ```
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Step 1: Extract and validate break glass token
    let token = extractBreakGlassToken(req);

    // Try request body as fallback
    if (!token) {
      try {
        const body = await req.json();
        token = extractTokenFromBody(body);
      } catch {
        // Body might be empty, continue with header/query token
      }
    }

    if (!token) {
      const errorResponse: AccessProjectError = {
        error: 'Break glass token required',
        details: 'Provide break_glass_token in request body, Authorization header with "Break-Glass <token>", or X-Break-Glass-Token header',
        code: 'INVALID_TOKEN',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Step 2: Validate the token
    const tokenValidation = await validateBreakGlassToken(req, token);
    if (!tokenValidation.valid) {
      const errorResponse: AccessProjectError = {
        error: 'Invalid or expired break glass token',
        details: `Reason: ${tokenValidation.reason}`,
        code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const adminId = tokenValidation.admin_id as string;
    const sessionId = tokenValidation.session?.id as string;

    // Step 3: Validate request parameters
    const validation = validateAccessRequest({
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

    // Step 4: Perform access operation
    const result = await accessProject({
      projectId,
      sessionId,
      adminId,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    // Step 5: Return success response
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[Access Project API] Error:', error);

    // Check if it's a structured error from the service
    if (error instanceof Error) {
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.error && errorObj.code) {
          const errorResponse: AccessProjectError = errorObj;
          return NextResponse.json(errorResponse, {
            status:
              errorResponse.code === 'PROJECT_NOT_FOUND'
                ? 404
                : 500,
          });
        }
      } catch {
        // Not a JSON error, continue with generic error handling
      }
    }

    // Generic error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse: AccessProjectError = {
      error: 'Failed to access project',
      details: errorMessage,
      code: 'ACCESS_FAILED',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * HEAD /api/admin/projects/[id]
 *
 * Check if a project exists (without returning full details).
 * Useful for validation purposes.
 *
 * @param req - Next.js request
 * @param params - Route parameters containing project ID
 * @returns 200 if project exists, 404 if not, 401 if unauthorized
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/projects/proj-123', {
 *   method: 'HEAD',
 *   headers: {
 *     'Authorization': 'Break-Glass session-uuid-456',
 *   },
 * });
 * const exists = response.ok;
 * ```
 */
export async function HEAD(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Validate break glass token
    const tokenValidation = await validateBreakGlassToken(req);
    if (!tokenValidation.valid) {
      return new Response(
        JSON.stringify({
          error: 'Invalid or expired break glass token',
          code: tokenValidation.reason === 'expired' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if project exists
    const pool = await import('@/lib/db').then((m) => m.getPool());
    const result = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [projectId]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Project exists - return 200 with no body
    return new Response(null, { status: 200 });
  } catch (error: unknown) {
    console.error('[Access Project API] HEAD error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check project existence' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Extract break glass token from request
 * Internal helper function
 */
function extractBreakGlassToken(req: NextRequest): string | null {
  // Try Authorization header first: "Break-Glass <token>"
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Break-Glass ')) {
    return authHeader.substring(12);
  }

  // Try X-Break-Glass-Token header
  const tokenHeader = req.headers.get('x-break-glass-token');
  if (tokenHeader) {
    return tokenHeader;
  }

  // Try query parameter
  const url = new URL(req.url);
  const tokenParam = url.searchParams.get('break_glass_token');
  if (tokenParam) {
    return tokenParam;
  }

  return null;
}
