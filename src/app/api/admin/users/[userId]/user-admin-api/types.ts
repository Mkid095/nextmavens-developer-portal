/**
 * Admin Users API - Type Definitions
 *
 * GET /api/admin/users/[userId]
 * PATCH /api/admin/users/[userId]
 * DELETE /api/admin/users/[userId]
 */

import type { Developer } from '@/lib/auth'

/**
 * User response data format
 */
export interface UserData {
  id: string
  email: string
  name: string | null
  organization: string | null
  role: string | null
  created_at: string
  updated_at: string | null
  auth_provider: 'email'
  auth_info: {
    user_id: string
    email: string
    name: string | null
    tenant_id: string
    role: string
    is_verified: boolean
    last_login_at: string | null
    sign_in_count: number
    created_at: string
    updated_at: string
  }
  user_metadata?: Record<string, unknown>
}

/**
 * User response wrapper
 */
export interface UserResponse {
  user: UserData
}

/**
 * PATCH request body
 */
export interface UpdateUserRequest {
  user_metadata?: Record<string, unknown>
}

/**
 * Delete success response
 */
export interface DeleteSuccessResponse {
  success: true
  message: string
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: string
}

/**
 * User details from database
 */
export interface DbUser {
  id: string
  email: string
  name: string | null
  organization: string | null
  role: string | null
  created_at: string
  updated_at: string | null
}
