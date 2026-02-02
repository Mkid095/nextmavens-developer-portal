/**
 * Authentication Library Module
 *
 * Provides authentication functions for JWT tokens, API keys,
 * and project status checking.
 *
 * US-001: Require project_id in JWT
 * US-004: Update Key Usage on Each Request
 * US-007: Enforce Status Checks at Gateway
 * US-009: Track Key Usage
 */

// Type definitions
export * from './types'

// Constants
export * from './constants'

// JWT token functions
export * from './jwt'

// Utility functions
export * from './utils'

// Project status checking
export * from './project-status'

// API key authentication
export * from './api-key'
