/**
 * Auth Service API Client - Type Definitions
 */

import type {
  EndUser,
  EndUserListQuery,
  EndUserListResponse,
  EndUserDetailResponse,
  DisableEndUserRequest,
  EnableEndUserRequest,
  EndUserStatusResponse,
  UpdateEndUserMetadataRequest,
  DeleteEndUserRequest,
  DeleteEndUserResponse,
  ResetEndUserPasswordRequest,
  ResetEndUserPasswordResponse,
  EndUserSessionsResponse,
  RevokeEndUserSessionRequest,
  RevokeEndUserSessionResponse,
  AuthHistoryListQuery,
  AuthHistoryListResponse,
  AuthServiceError,
} from '@/lib/types/auth-user.types'

/**
 * Auth service configuration
 */
export interface AuthServiceConfig {
  baseUrl: string
  apiKey: string
}

export type {
  EndUser,
  EndUserListQuery,
  EndUserListResponse,
  EndUserDetailResponse,
  DisableEndUserRequest,
  EnableEndUserRequest,
  EndUserStatusResponse,
  UpdateEndUserMetadataRequest,
  DeleteEndUserRequest,
  DeleteEndUserResponse,
  ResetEndUserPasswordRequest,
  ResetEndUserPasswordResponse,
  EndUserSessionsResponse,
  RevokeEndUserSessionRequest,
  RevokeEndUserSessionResponse,
  AuthHistoryListQuery,
  AuthHistoryListResponse,
  AuthServiceError,
}
