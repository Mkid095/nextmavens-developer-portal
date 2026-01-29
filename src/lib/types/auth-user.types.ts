/**
 * Auth Service User Management Types
 * Types for the auth service end-user management integration
 * These types are for managing application end-users via the auth service
 */

/**
 * End-user account status
 */
export type EndUserStatus = 'active' | 'disabled' | 'deleted'

/**
 * Authentication provider type for end-users
 */
export type EndUserAuthProvider = 'email' | 'google' | 'github' | 'microsoft'

/**
 * Base end-user interface from auth service
 */
export interface EndUser {
  user_id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  sign_in_count: number
  auth_provider: EndUserAuthProvider
  user_metadata: Record<string, unknown>
  status: EndUserStatus
}

/**
 * Request to disable an end-user
 */
export interface DisableEndUserRequest {
  userId: string
  reason?: string
}

/**
 * Request to enable (re-enable) an end-user
 */
export interface EnableEndUserRequest {
  userId: string
}

/**
 * Response from disable/enable end-user operations
 */
export interface EndUserStatusResponse {
  user_id: string
  status: EndUserStatus
  updated_at: string
}

/**
 * End-user list query parameters
 */
export interface EndUserListQuery {
  limit?: number
  offset?: number
  search?: string
  status?: EndUserStatus
  auth_provider?: EndUserAuthProvider
  created_after?: string
  created_before?: string
  last_sign_in_after?: string
  last_sign_in_before?: string
  sort_by?: 'created_at' | 'last_sign_in_at' | 'email' | 'name'
  sort_order?: 'asc' | 'desc'
}

/**
 * Paginated end-user list response
 */
export interface EndUserListResponse {
  users: EndUser[]
  total: number
  limit: number
  offset: number
}

/**
 * End-user detail response
 */
export interface EndUserDetailResponse extends EndUser {}

/**
 * Request to update end-user metadata
 */
export interface UpdateEndUserMetadataRequest {
  userId: string
  metadata: Record<string, unknown>
}

/**
 * Request to delete an end-user
 */
export interface DeleteEndUserRequest {
  userId: string
  reason?: string
}

/**
 * Delete end-user response
 */
export interface DeleteEndUserResponse {
  user_id: string
  deleted: boolean
  deleted_at: string
}

/**
 * Request to reset end-user password
 */
export interface ResetEndUserPasswordRequest {
  userId: string
  email?: string
}

/**
 * Reset end-user password response
 */
export interface ResetEndUserPasswordResponse {
  user_id: string
  email_sent: boolean
  message: string
}

/**
 * Auth service API error response
 */
export interface AuthServiceError {
  error: string
  message: string
  code?: string
  details?: Record<string, unknown>
}

/**
 * End-user session information
 */
export interface EndUserSession {
  session_id: string
  user_id: string
  device_type?: string
  device_name?: string
  browser?: string
  ip_address?: string
  location?: string
  created_at: string
  last_activity_at: string
  is_revoked: boolean
}

/**
 * Request to revoke an end-user session
 */
export interface RevokeEndUserSessionRequest {
  userId: string
  sessionId: string
}

/**
 * Response from session revocation
 */
export interface RevokeEndUserSessionResponse {
  session_id: string
  revoked: boolean
  revoked_at: string
}

/**
 * End-user sessions list response
 */
export interface EndUserSessionsResponse {
  sessions: EndUserSession[]
  total: number
}

// Legacy type aliases for backward compatibility
/**
 * @deprecated Use EndUserStatus instead
 */
export type UserStatus = EndUserStatus

/**
 * @deprecated Use EndUserAuthProvider instead
 */
export type AuthProvider = EndUserAuthProvider

/**
 * @deprecated Use EndUser instead
 */
export type User = EndUser

/**
 * @deprecated Use DisableEndUserRequest instead
 */
export type DisableUserRequest = DisableEndUserRequest

/**
 * @deprecated Use EnableEndUserRequest instead
 */
export type EnableUserRequest = EnableEndUserRequest

/**
 * @deprecated Use EndUserStatusResponse instead
 */
export type UserStatusResponse = EndUserStatusResponse

/**
 * @deprecated Use EndUserListQuery instead
 */
export type UserListQuery = EndUserListQuery

/**
 * @deprecated Use EndUserListResponse instead
 */
export type UserListResponse = EndUserListResponse

/**
 * @deprecated Use EndUserDetailResponse instead
 */
export type UserDetailResponse = EndUserDetailResponse

/**
 * @deprecated Use UpdateEndUserMetadataRequest instead
 */
export type UpdateUserMetadataRequest = UpdateEndUserMetadataRequest

/**
 * @deprecated Use DeleteEndUserRequest instead
 */
export type DeleteUserRequest = DeleteEndUserRequest

/**
 * @deprecated Use DeleteEndUserResponse instead
 */
export type DeleteUserResponse = DeleteEndUserResponse

/**
 * @deprecated Use ResetEndUserPasswordRequest instead
 */
export type ResetPasswordRequest = ResetEndUserPasswordRequest

/**
 * @deprecated Use ResetEndUserPasswordResponse instead
 */
export type ResetPasswordResponse = ResetEndUserPasswordResponse

/**
 * @deprecated Use EndUserSession instead
 */
export type UserSession = EndUserSession

/**
 * @deprecated Use RevokeEndUserSessionRequest instead
 */
export type RevokeSessionRequest = RevokeEndUserSessionRequest

/**
 * @deprecated Use RevokeEndUserSessionResponse instead
 */
export type RevokeSessionResponse = RevokeEndUserSessionResponse
