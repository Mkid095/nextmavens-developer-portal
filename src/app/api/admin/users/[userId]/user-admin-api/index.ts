/**
 * Admin Users API Module
 *
 * GET /api/admin/users/[userId]
 * - Get detailed information about a specific user
 * - Only operators and admins can view user details
 *
 * PATCH /api/admin/users/[userId]
 * - Update user metadata
 * - Only operators and admins can update user metadata
 *
 * DELETE /api/admin/users/[userId]
 * - Remove a user from the platform
 * - Only admins can remove users
 */

// Type definitions
export * from './types'

// Validation schemas
export * from './validation'

// Utility functions
export * from './utils'

// HTTP handlers
export * from './handlers'
