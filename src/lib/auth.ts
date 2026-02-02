/**
 * Authentication Library
 *
 * @deprecated This file has been refactored into the auth-module.
 * Please import from './auth-module' instead.
 *
 * Provides authentication functions for JWT tokens, API keys,
 * and project status checking.
 *
 * US-001: Require project_id in JWT
 * US-004: Update Key Usage on Each Request
 * US-007: Enforce Status Checks at Gateway
 * US-009: Track Key Usage
 */

export * from './auth-module'
