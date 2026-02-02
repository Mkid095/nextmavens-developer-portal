/**
 * POST /api/admin/break-glass
 *
 * Break Glass Authentication Endpoint
 *
 * Initiates an emergency admin session with elevated privileges.
 * Requires admin/operator role and 2FA verification.
 *
 * US-003: Implement Break Glass Authentication
 *
 * Security considerations:
 * - Requires authenticated admin/operator
 * - Requires TOTP or hardware key verification (simplified for initial implementation)
 * - Requires reason for emergency access
 * - Creates time-limited session (1 hour)
 * - All actions are logged with before/after states
 *
 * @example
 * ```bash
 * curl -X POST https://api.example.com/api/admin/break-glass \
 *   -H "Authorization: Bearer <admin-jwt-token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "code": "123456",
 *     "reason": "Need to unlock false positive suspension",
 *     "access_method": "otp"
 *   }'
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, type Developer } from '@/lib/auth';
import { requireOperatorOrAdmin } from '@/features/abuse-controls/lib/authorization';
import {
  createAdminSession,
  AdminAccessMethod,
} from '@/features/break-glass/lib/admin-database';
import { sendBreakGlassSessionCreatedNotification } from '@/features/break-glass/lib/notifications';
import type {
  BreakGlassAuthRequest,
  BreakGlassAuthResponse,
  BreakGlassAuthError,
} from '@/features/break-glass/types/auth.types';

/**
 * Validate break glass request body
 */
function validateBreakGlassRequest(
  body: unknown
): { valid: boolean; errors?: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  if (!body || typeof body !== 'object') {
    errors.push({ field: 'body', message: 'Request body is required' });
    return { valid: false, errors };
  }

  const b = body as Record<string, unknown>;

  // Validate code (TOTP or emergency code)
  if (!b.code || typeof b.code !== 'string') {
    errors.push({ field: 'code', message: 'TOTP code is required' });
  } else if (b.code.length < 6 || b.code.length > 8) {
    errors.push({
      field: 'code',
      message: 'Code must be 6-8 digits',
    });
  }

  // Validate reason
  if (!b.reason || typeof b.reason !== 'string') {
    errors.push({ field: 'reason', message: 'Reason for emergency access is required' });
  } else if (b.reason.length < 10) {
    errors.push({
      field: 'reason',
      message: 'Reason must be at least 10 characters',
    });
  } else if (b.reason.length > 500) {
    errors.push({
      field: 'reason',
      message: 'Reason must be less than 500 characters',
    });
  }

  // Validate access_method
  if (!b.access_method || typeof b.access_method !== 'string') {
    errors.push({
      field: 'access_method',
      message: 'Access method is required',
    });
  } else if (
    !['hardware_key', 'otp', 'emergency_code'].includes(b.access_method)
  ) {
    errors.push({
      field: 'access_method',
      message: 'Access method must be hardware_key, otp, or emergency_code',
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * POST handler for break glass authentication
 */
export async function POST(req: NextRequest) {
  try {
    // Step 1: Authenticate the request (verify admin JWT)
    const jwtPayload = await authenticateRequest(req);

    // Convert JwtPayload to Developer for authorization
    const developer: Developer = {
      id: jwtPayload.id,
      email: jwtPayload.email,
      name: '', // Name not available in JWT payload
    };

    // Step 2: Authorize - only operators and admins can initiate break glass
    await requireOperatorOrAdmin(developer);

    // Step 3: Parse request body
    const body: BreakGlassAuthRequest = await req.json();

    // Step 4: Validate request
    const validation = validateBreakGlassRequest(body);
    if (!validation.valid) {
      const errorResponse: BreakGlassAuthError = {
        success: false,
        error: 'Invalid request',
        code: 'AUTH_FAILED',
        details: validation.errors?.map((e) => `${e.field}: ${e.message}`).join(', '),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { code, reason, access_method } = body;

    // Step 5: Verify TOTP code (simplified for initial implementation)
    // In production, this would:
    // - Look up the admin's TOTP secret from database
    // - Verify the code using crypto/TOTP library
    // - For hardware keys, verify WebAuthn assertion
    // - For emergency codes, verify against stored backup codes
    //
    // For this implementation, we accept any 6-digit code from operators/admins
    // TODO: Implement proper TOTP verification with Speakeasy or similar library

    // Validate code is numeric
    if (!/^\d{6}$/.test(code)) {
      const errorResponse: BreakGlassAuthError = {
        success: false,
        error: 'Invalid TOTP code',
        code: 'INVALID_CODE',
        details: 'Code must be 6 digits',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Step 6: Create admin session
    const session = await createAdminSession({
      admin_id: developer.id,
      reason,
      access_method: access_method as AdminAccessMethod,
      granted_by: developer.id, // Self-granted for now
      expires_in_hours: 1, // Sessions expire after 1 hour
    });

    // Step 7: Send notification to platform owners about the new session
    // Extract IP address for audit purposes
    const ipAddress = req.headers.get('x-forwarded-for') ||
                      req.headers.get('x-real-ip') ||
                      undefined;

    try {
      await sendBreakGlassSessionCreatedNotification({
        adminEmail: developer.email || 'unknown@example.com',
        adminId: developer.id,
        sessionId: session.id,
        reason,
        accessMethod: access_method,
        expiresAt: session.expires_at,
        ipAddress,
      });
      console.log(`[Break Glass] Session created notification sent for session ${session.id}`);
    } catch (error) {
      // Log notification error but don't fail the session creation
      console.error('[Break Glass] Failed to send session notification:', error);
      // The session is still created and valid, just the notification failed
    }

    // Step 8: Calculate expiration time
    const expiresAt = new Date(session.expires_at);
    const now = new Date();
    const expiresInSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

    // Step 9: Return success response with session token
    const response: BreakGlassAuthResponse = {
      success: true,
      session_token: session.id,
      session_id: session.id,
      expires_at: session.expires_at.toISOString(),
      expires_in_seconds: expiresInSeconds,
      admin_id: session.admin_id,
      created_at: session.created_at.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    console.error('[Break Glass] Authentication error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';

    // Handle authentication errors
    if (errorMessage === 'No token provided' || errorMessage === 'Invalid token') {
      const errorResponse: BreakGlassAuthError = {
        success: false,
        error: 'Authentication required',
        code: 'INVALID_CREDENTIALS',
        details: 'You must be logged in as an admin or operator to use break glass',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Handle authorization errors
    if (
      errorMessage.includes('operator or administrator') ||
      errorMessage.includes('administrator privileges')
    ) {
      const errorResponse: BreakGlassAuthError = {
        success: false,
        error: 'Insufficient privileges',
        code: 'AUTH_FAILED',
        details: 'Break glass access is only available to operators and administrators',
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Handle session creation errors
    if (errorMessage.includes('session') || errorMessage.includes('database')) {
      const errorResponse: BreakGlassAuthError = {
        success: false,
        error: 'Failed to create session',
        code: 'SESSION_CREATION_FAILED',
        details: errorMessage,
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Generic error
    const errorResponse: BreakGlassAuthError = {
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
      details: errorMessage,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET handler for break glass session info (optional)
 *
 * Returns info about the current break glass session if valid token provided
 */
export async function GET(req: NextRequest) {
  try {
    // This would validate and return session info
    // For now, return 404 as this endpoint is primarily POST
    return NextResponse.json(
      {
        error: 'Method not allowed',
        hint: 'Use POST to authenticate with break glass',
      },
      { status: 405 }
    );
  } catch (error: unknown) {
    const errorResponse: BreakGlassAuthError = {
      success: false,
      error: 'Request failed',
      code: 'AUTH_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
