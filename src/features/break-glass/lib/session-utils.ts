/**
 * Session Expiration Utilities
 *
 * Utilities for checking session expiration status and providing warnings.
 * Supports US-010: Session expiration with warnings.
 *
 * @example
 * ```typescript
 * import { getSessionStatus, formatExpirationTime } from './session-utils';
 *
 * const status = getSessionStatus(session);
 * if (status.warning === 'expiring_soon') {
 *   console.warn('Session expiring soon!');
 * }
 * ```
 */

import type { AdminSession, AdminSessionValidation } from './admin-database';

/**
 * Session status levels
 */
export enum SessionStatus {
  /** Session is healthy (more than 5 minutes remaining) */
  HEALTHY = 'healthy',
  /** Session is expiring soon (5 minutes or less) */
  EXPIRING_SOON = 'expiring_soon',
  /** Session has expired */
  EXPIRED = 'expired',
  /** Session not found */
  NOT_FOUND = 'not_found',
}

/**
 * Extended session status with metadata
 */
export interface SessionStatusInfo {
  status: SessionStatus;
  warning?: 'expiring_soon';
  expires_in_seconds?: number;
  expires_at?: string;
  time_remaining?: string;
}

/**
 * Constants for expiration thresholds
 */
export const EXPIRATION_WARNING_SECONDS = 5 * 60; // 5 minutes
export const EXPIRATION_CRITICAL_SECONDS = 60; // 1 minute
export const SESSION_EXPIRATION_SECONDS = 60 * 60; // 1 hour

/**
 * Get session status from a validation result
 *
 * @param validation - Admin session validation result
 * @returns Session status info with warning flags
 *
 * @example
 * ```typescript
 * const validation = await validateAdminSession(token);
 * const status = getSessionStatusFromValidation(validation);
 *
 * if (status.status === SessionStatus.EXPIRING_SOON) {
 *   notifyUser(`Session expiring in ${status.time_remaining}`);
 * }
 * ```
 */
export function getSessionStatusFromValidation(
  validation: AdminSessionValidation
): SessionStatusInfo {
  // Not found or invalid
  if (!validation.valid) {
    return {
      status:
        validation.reason === 'not_found'
          ? SessionStatus.NOT_FOUND
          : SessionStatus.EXPIRED,
      warning: undefined,
    };
  }

  const expiresInSeconds = validation.expires_in_seconds || 0;

  // Check expiration status
  if (expiresInSeconds <= EXPIRATION_WARNING_SECONDS) {
    return {
      status: SessionStatus.EXPIRING_SOON,
      warning: 'expiring_soon',
      expires_in_seconds: expiresInSeconds,
      expires_at: validation.expires_at,
      time_remaining: formatExpirationTime(expiresInSeconds),
    };
  }

  return {
    status: SessionStatus.HEALTHY,
    expires_in_seconds: expiresInSeconds,
    expires_at: validation.expires_at,
    time_remaining: formatExpirationTime(expiresInSeconds),
  };
}

/**
 * Get session status from a session object
 *
 * @param session - Admin session object
 * @returns Session status info
 *
 * @example
 * ```typescript
 * const session = await getAdminSession(sessionId);
 * const status = getSessionStatus(session);
 *
 * console.log('Session status:', status.status);
 * console.log('Time remaining:', status.time_remaining);
 * ```
 */
export function getSessionStatus(session: AdminSession | null): SessionStatusInfo {
  if (!session) {
    return {
      status: SessionStatus.NOT_FOUND,
    };
  }

  const now = Date.now();
  const expiresAt = new Date(session.expires_at).getTime();
  const expiresInSeconds = Math.floor((expiresAt - now) / 1000);

  // Session has expired
  if (expiresInSeconds <= 0) {
    return {
      status: SessionStatus.EXPIRED,
      expires_in_seconds: 0,
      expires_at: session.expires_at.toISOString(),
    };
  }

  // Session is expiring soon
  if (expiresInSeconds <= EXPIRATION_WARNING_SECONDS) {
    return {
      status: SessionStatus.EXPIRING_SOON,
      warning: 'expiring_soon',
      expires_in_seconds: expiresInSeconds,
      expires_at: session.expires_at.toISOString(),
      time_remaining: formatExpirationTime(expiresInSeconds),
    };
  }

  // Session is healthy
  return {
    status: SessionStatus.HEALTHY,
    expires_in_seconds: expiresInSeconds,
    expires_at: session.expires_at.toISOString(),
    time_remaining: formatExpirationTime(expiresInSeconds),
  };
}

/**
 * Format expiration time in human-readable format
 *
 * @param seconds - Seconds until expiration
 * @returns Formatted time string (e.g., "45m 30s", "2m 15s", "45s")
 *
 * @example
 * ```typescript
 * formatExpirationTime(3665); // "1h 1m 5s"
 * formatExpirationTime(300);  // "5m 0s"
 * formatExpirationTime(45);   // "0m 45s"
 * ```
 */
export function formatExpirationTime(seconds: number): string {
  if (seconds <= 0) {
    return 'expired';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Check if session is expiring soon
 *
 * @param validation - Admin session validation result
 * @returns true if session expires within 5 minutes
 *
 * @example
 * ```typescript
 * const validation = await validateAdminSession(token);
 * if (isExpiringSoon(validation)) {
 *   showWarning('Your session will expire soon!');
 * }
 * ```
 */
export function isExpiringSoon(validation: AdminSessionValidation): boolean {
  return validation.warning === 'expiring_soon';
}

/**
 * Check if session is critically low on time
 *
 * @param validation - Admin session validation result
 * @returns true if session expires within 1 minute
 *
 * @example
 * ```typescript
 * const validation = await validateAdminSession(token);
 * if (isCriticallyLow(validation)) {
 *   showCriticalAlert('Session expiring in less than 1 minute!');
 * }
 * ```
 */
export function isCriticallyLow(validation: AdminSessionValidation): boolean {
  const seconds = validation.expires_in_seconds || 0;
  return seconds <= EXPIRATION_CRITICAL_SECONDS && seconds > 0;
}

/**
 * Get warning message based on session status
 *
 * @param validation - Admin session validation result
 * @returns Warning message or null if no warning
 *
 * @example
 * ```typescript
 * const validation = await validateAdminSession(token);
 * const warning = getExpirationWarning(validation);
 * if (warning) {
 *   console.warn(warning);
 * }
 * ```
 */
export function getExpirationWarning(validation: AdminSessionValidation): string | null {
  if (!validation.valid) {
    return validation.reason === 'expired'
      ? 'Session has expired. Please re-authenticate.'
      : null;
  }

  if (!validation.expires_in_seconds) {
    return null;
  }

  const seconds = validation.expires_in_seconds;

  if (seconds <= 0) {
    return 'Session has expired. Please re-authenticate.';
  }

  if (seconds <= EXPIRATION_CRITICAL_SECONDS) {
    return `Session expiring in ${formatExpirationTime(seconds)}. Re-authenticate now!`;
  }

  if (seconds <= EXPIRATION_WARNING_SECONDS) {
    return `Session expiring in ${formatExpirationTime(seconds)}. Consider re-authenticating.`;
  }

  return null;
}

/**
 * Calculate session expiration timestamp
 *
 * @param hoursFromNow - Hours from now (default: 1 hour)
 * @returns ISO timestamp of expiration time
 *
 * @example
 * ```typescript
 * const expiresAt = calculateExpirationTime(1); // 1 hour from now
 * const expiresAt = calculateExpirationTime(0.5); // 30 minutes from now
 * ```
 */
export function calculateExpirationTime(hoursFromNow: number = 1): string {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
  return expiresAt.toISOString();
}
