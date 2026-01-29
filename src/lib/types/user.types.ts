/**
 * Auth User Manager Types
 *
 * Type definitions for the auth user manager UI.
 * These types match the auth service users table structure.
 *
 * US-002: Create User List Component
 */

import type {
  EndUser,
  EndUserListQuery,
  EndUserListResponse,
  EndUserStatus,
  EndUserAuthProvider,
} from './auth-user.types'

/**
 * Re-export auth service types for convenience
 */
export type {
  EndUser,
  EndUserListQuery,
  EndUserListResponse,
  EndUserStatus,
  EndUserAuthProvider,
}

/**
 * User API response with pagination info
 * Extends the auth service response with additional metadata
 */
export interface UserApiResponse {
  users: EndUser[]
  pagination: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}

/**
 * Query parameters for fetching users (alias for EndUserListQuery)
 */
export type UserQueryParams = EndUserListQuery

/**
 * Filter state for the user list
 */
export interface UserFilters {
  search: string
  status: string
  authProvider: string
  createdAfter: string
  createdBefore: string
  lastSignInAfter: string
  lastSignInBefore: string
}

/**
 * Sort state for the user list
 */
export interface UserSort {
  column: 'created_at' | 'last_sign_in_at' | 'email' | 'name'
  direction: 'asc' | 'desc'
}

/**
 * Available user status options for filtering
 */
export const USER_STATUS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'deleted', label: 'Deleted' },
] as const

/**
 * Available authentication providers for filtering
 */
export const AUTH_PROVIDERS = [
  { value: '', label: 'All Providers' },
  { value: 'email', label: 'Email' },
  { value: 'google', label: 'Google' },
  { value: 'github', label: 'GitHub' },
  { value: 'microsoft', label: 'Microsoft' },
] as const
