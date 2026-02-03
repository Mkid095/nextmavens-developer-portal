/**
 * Auth Usage Tracking Service
 *
 * @deprecated This file has been refactored into the auth-tracking-module.
 * Please import from './auth-tracking-module' instead.
 * All functionality is now organized in separate files for better maintainability.
 *
 * Tracks auth usage metrics for user growth analytics:
 * - auth_signup: Number of user registrations
 * - auth_signin: Number of successful logins
 *
 * All tracking is done asynchronously (fire-and-forget) to avoid blocking requests.
 *
 * US-005 from prd-usage-tracking.json
 */

// Re-export everything from the module for backward compatibility
export * from './auth-tracking-module'
