/**
 * API Route: Admin Users Management
 *
 * @deprecated This file has been refactored into the user-admin-api module.
 * Please import from './user-admin-api' instead.
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

export { GET } from './user-admin-api/handlers/get'
export { PATCH } from './user-admin-api/handlers/patch'
export { DELETE } from './user-admin-api/handlers/delete'
