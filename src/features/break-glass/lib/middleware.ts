/**
 * Break Glass Middleware
 *
 * Middleware for validating break glass session tokens on admin power endpoints.
 * Ensures that only valid, non-expired break glass sessions can perform emergency actions.
 *
 * US-003: Implement Break Glass Authentication
 * US-004: Implement Unlock Project Power
 *
 * @example
 * ```typescript
 * import { validateBreakGlassToken } from '@/features/break-glass/lib/middleware';
 *
 * // In an API route
 * const session = await validateBreakGlassToken(request);
 * if (!session.valid) {
 *   return NextResponse.json(
 *     { error: 'Invalid or expired break glass token' },
 *     { status: 401 }
 *   );
 * }
 * ```
 */

import { NextRequest } from 'next/server';
import {
  validateAdminSession,
  type AdminSession,
  type AdminSessionValidation,
} from './admin-database';

/**
 * Admin session info (lightweight version for middleware)
 */
export interface AdminSessionInfo {
  id: string;
  admin_id: string;
  reason: string;
  access_method: string;
  granted_by: string | null;
  expires_at: Date;
  created_at: Date;
}

/**
 * Break glass token validation result
 */
export interface BreakGlassTokenValidation {
  /** Whether the token is valid */
  valid: boolean;

  /** Reason for validation failure (if invalid) */
  reason?: 'no_token' | 'invalid_format' | 'not_found' | 'expired';

  /** The admin session (if valid) */
  session?: AdminSessionInfo;

  /** Time until expiration (in seconds, if valid) */
  expires_in_seconds?: number;

  /** Warning when session is about to expire (within 5 minutes) */
  warning?: 'expiring_soon';

  /** ISO timestamp when session expires */
  expires_at?: string;

  /** Admin ID from the session */
  admin_id?: string;
}

/**
 * Extract break glass token from request
 *
 * @param req - Next.js request object
 * @returns The break glass token or null
 *
 * @example
 * ```typescript
 * const token = extractBreakGlassToken(request);
 * if (!token) {
 *   throw new Error('No break glass token provided');
 * }
 * ```
 */
export function extractBreakGlassToken(req: NextRequest): string | null {
  // Try Authorization header first: "Break-Glass <token>"
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Break-Glass ')) {
    return authHeader.substring(12); // "Break-Glass ".length === 12
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

  // Try request body (will be parsed separately)
  return null;
}

/**
 * Validate break glass token from request
 *
 * Checks if the provided break glass token is valid and not expired.
 *
 * @param req - Next.js request object
 * @param token - Optional token (if already extracted)
 * @returns Validation result with session details if valid
 *
 * @example
 * ```typescript
 * const validation = await validateBreakGlassToken(request);
 * if (!validation.valid) {
 *   return NextResponse.json(
 *     { error: 'Invalid break glass token', reason: validation.reason },
 *     { status: 401 }
 *   );
 * }
 * console.log('Admin ID:', validation.admin_id);
 * ```
 */
export async function validateBreakGlassToken(
  req: NextRequest,
  token?: string
): Promise<BreakGlassTokenValidation> {
  // Extract token if not provided
  const sessionToken = token || extractBreakGlassToken(req);

  if (!sessionToken) {
    return {
      valid: false,
      reason: 'no_token',
    };
  }

  // Validate token format (should be a UUID)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionToken)) {
    return {
      valid: false,
      reason: 'invalid_format',
    };
  }

  // Validate session with database
  const sessionValidation = await validateAdminSession(sessionToken);

  if (!sessionValidation.valid) {
    return {
      valid: false,
      reason: sessionValidation.reason as 'not_found' | 'expired',
    };
  }

  // Extract admin ID from session
  const admin_id = sessionValidation.session?.admin_id;

  // Convert to lightweight session info
  const sessionInfo: AdminSessionInfo = {
    id: sessionValidation.session!.id,
    admin_id: sessionValidation.session!.admin_id,
    reason: sessionValidation.session!.reason,
    access_method: sessionValidation.session!.access_method,
    granted_by: sessionValidation.session!.granted_by,
    expires_at: sessionValidation.session!.expires_at,
    created_at: sessionValidation.session!.created_at,
  };

  return {
    valid: true,
    session: sessionInfo,
    expires_in_seconds: sessionValidation.expires_in_seconds,
    ...(sessionValidation.warning && { warning: sessionValidation.warning }),
    ...(sessionValidation.expires_at && { expires_at: sessionValidation.expires_at }),
    admin_id,
  };
}

/**
 * Middleware helper to require valid break glass token
 *
 * Use this in API routes to ensure only valid break glass sessions proceed.
 * Returns a NextResponse error if invalid, or the admin ID if valid.
 *
 * @param req - Next.js request object
 * @returns Either an error response or the admin ID
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const authResult = await requireBreakGlassToken(req);
 *   if (authResult instanceof NextResponse) {
 *     return authResult; // Error response
 *   }
 *
 *   const adminId = authResult; // Admin ID from valid session
 *   // Proceed with admin operation...
 * }
 * ```
 */
export async function requireBreakGlassToken(
  req: NextRequest
): Promise<string | Response> {
  const validation = await validateBreakGlassToken(req);

  if (!validation.valid) {
    const errorMessages: Record<string, string> = {
      no_token: 'Break glass token is required',
      invalid_format: 'Invalid break glass token format',
      not_found: 'Break glass session not found',
      expired: 'Break glass session has expired',
    };

    return new Response(
      JSON.stringify({
        error: errorMessages[validation.reason || 'unknown'],
        code: validation.reason?.toUpperCase() || 'UNKNOWN',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return validation.admin_id as string;
}

/**
 * Extract break glass token from request body
 *
 * @param body - Request body that might contain break_glass_token
 * @returns The break glass token or null
 *
 * @example
 * ```typescript
 * const body = await req.json();
 * const token = extractTokenFromBody(body);
 * if (!token) {
 *   return NextResponse.json(
 *     { error: 'break_glass_token required in request body' },
 *     { status: 401 }
 *   );
 * }
 * ```
 */
export function extractTokenFromBody(body: unknown): string | null {
  if (
    body &&
    typeof body === 'object' &&
    'break_glass_token' in body &&
    typeof body.break_glass_token === 'string'
  ) {
    return body.break_glass_token;
  }
  return null;
}

// Re-export types for convenience
export type { AdminSession, AdminAction, AdminAccessMethod, AdminActionType, AdminTargetType } from './admin-database';
