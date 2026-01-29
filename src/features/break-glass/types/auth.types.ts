/**
 * Break Glass Authentication Types
 *
 * Type definitions for break glass authentication endpoint.
 *
 * US-003: Implement Break Glass Authentication
 */

/**
 * Request body for break glass authentication
 */
export interface BreakGlassAuthRequest {
  /** Two-factor authentication code (TOTP or backup code) */
  code: string;

  /** Reason for emergency access (required) */
  reason: string;

  /** Access method being used */
  access_method: 'hardware_key' | 'otp' | 'emergency_code';

  /** Hardware key assertion (if using hardware key) */
  assertion?: {
    credentialId: string;
    authenticatorData: string;
    signature: string;
    clientDataJSON: string;
  };
}

/**
 * Response from successful break glass authentication
 */
export interface BreakGlassAuthResponse {
  /** Whether authentication was successful */
  success: true;

  /** The break glass session token (UUID) */
  session_token: string;

  /** Session ID (same as token) */
  session_id: string;

  /** When the session expires (ISO 8601 timestamp) */
  expires_at: string;

  /** Seconds until expiration */
  expires_in_seconds: number;

  /** The admin's developer ID */
  admin_id: string;

  /** Timestamp when session was created */
  created_at: string;
}

/**
 * Error response from break glass authentication
 */
export interface BreakGlassAuthError {
  /** Whether authentication was successful */
  success: false;

  /** Error message */
  error: string;

  /** Error code for categorization */
  code:
    | 'INVALID_CREDENTIALS'
    | 'INVALID_CODE'
    | 'INVALID_REASON'
    | 'INVALID_ACCESS_METHOD'
    | 'AUTH_FAILED'
    | 'SESSION_CREATION_FAILED';

  /** Detailed error information */
  details?: string;
}

/**
 * Combined response type (success or error)
 */
export type BreakGlassAuthResponseUnion = BreakGlassAuthResponse | BreakGlassAuthError;

/**
 * Break glass session info (from token)
 */
export interface BreakGlassSessionInfo {
  /** Session ID (token) */
  session_id: string;

  /** Admin's developer ID */
  admin_id: string;

  /** Reason for access */
  reason: string;

  /** Access method used */
  access_method: 'hardware_key' | 'otp' | 'emergency_code';

  /** Who granted access */
  granted_by: string | null;

  /** Expiration timestamp */
  expires_at: string;

  /** Session creation timestamp */
  created_at: string;

  /** Seconds until expiration */
  expires_in_seconds: number;
}

/**
 * Validation result for break glass request
 */
export interface BreakGlassAuthValidation {
  /** Whether the request is valid */
  valid: boolean;

  /** Validation errors if invalid */
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
