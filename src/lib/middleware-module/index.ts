/**
 * Authentication and Authorization Middleware Module
 *
 * Provides middleware functions for Next.js API routes to handle
 * authentication, project status checking, and permission checking.
 *
 * US-004: Create Permission Middleware
 * US-007: Enforce Status Checks at Gateway
 */

// Type definitions
export * from './types'

// Authentication functions
export * from './authenticate'

// Permission middleware functions
export * from './permissions'
