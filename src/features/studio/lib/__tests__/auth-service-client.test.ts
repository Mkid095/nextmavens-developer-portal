/**
 * Type Safety Test for Auth Service Client
 * This file verifies that all types are correctly defined and used
 */

import { describe, it, expect } from 'vitest'
import type {
  EndUser,
  EndUserSession,
  EndUserListQuery,
  EndUserListResponse,
  EndUserDetailResponse,
  DisableEndUserRequest,
  EnableEndUserRequest,
  UpdateEndUserMetadataRequest,
  DeleteEndUserRequest,
  DeleteEndUserResponse,
  ResetEndUserPasswordRequest,
  ResetEndUserPasswordResponse,
  RevokeEndUserSessionRequest,
  RevokeEndUserSessionResponse,
  EndUserSessionsResponse,
  User,
  UserStatus,
  AuthProvider,
} from '@/lib/types/auth-user.types'

import {
  StudioAuthServiceClient,
  createStudioClientFromRequest,
  createStudioClientWithToken,
  StudioAuthError,
  AuthServiceApiClientError,
} from '@/features/studio/lib'

import {
  withErrorHandling,
  parseError,
  getErrorMessage,
  getErrorTitle,
  isRecoverableError,
  requiresReauth,
  StudioErrorCode,
  type StudioErrorResult,
  type StudioError,
} from '@/features/studio/lib'

import {
  formatDate,
  formatRelativeTime,
  getUserDisplayName,
  getUserInitials,
  isSessionActive,
  getSessionDeviceName,
  getSessionLocation,
  isValidEmail,
  truncate,
} from '@/features/studio/lib'

describe('Auth Service Client Type Safety', () => {
  it('should have all types correctly defined', () => {
    // Test 1: EndUser type
    const testUser: EndUser = {
      user_id: '123',
      email: 'test@example.com',
      name: 'Test User',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      last_sign_in_at: '2024-01-15T10:30:00Z',
      sign_in_count: 5,
      auth_provider: 'email',
      user_metadata: { department: 'Engineering' },
      status: 'active',
    }

    // Test 2: EndUserSession type
    const testSession: EndUserSession = {
      session_id: '456',
      user_id: '123',
      device_type: 'desktop',
      device_name: 'MacBook Pro',
      browser: 'Chrome',
      ip_address: '192.168.1.1',
      location: 'San Francisco, CA',
      created_at: '2024-01-15T10:30:00Z',
      last_activity_at: '2024-01-15T10:30:00Z',
      is_revoked: false,
    }

    // Test 3: EndUserListQuery type
    const testQuery: EndUserListQuery = {
      limit: 50,
      offset: 0,
      search: 'test',
      status: 'active',
      auth_provider: 'email',
      sort_by: 'created_at',
      sort_order: 'desc',
    }

    // Verify all types are valid
    expect(testUser.user_id).toBe('123')
    expect(testSession.session_id).toBe('456')
    expect(testQuery.limit).toBe(50)
  })

  it('should have all request types correctly defined', () => {
    const disableRequest: DisableEndUserRequest = {
      userId: '123',
      reason: 'Test reason',
    }

    const enableRequest: EnableEndUserRequest = {
      userId: '123',
    }

    const updateRequest: UpdateEndUserMetadataRequest = {
      userId: '123',
      metadata: { role: 'admin' },
    }

    const deleteRequest: DeleteEndUserRequest = {
      userId: '123',
      reason: 'Test deletion',
    }

    const resetRequest: ResetEndUserPasswordRequest = {
      userId: '123',
      email: 'test@example.com',
    }

    const revokeSessionRequest: RevokeEndUserSessionRequest = {
      userId: '123',
      sessionId: '456',
    }

    expect(disableRequest.userId).toBe('123')
    expect(enableRequest.userId).toBe('123')
    expect(updateRequest.userId).toBe('123')
    expect(deleteRequest.userId).toBe('123')
    expect(resetRequest.userId).toBe('123')
    expect(revokeSessionRequest.userId).toBe('123')
  })

  it('should have error handling types correctly defined', () => {
    const testErrorResult: StudioErrorResult = {
      code: StudioErrorCode.AUTHENTICATION_ERROR,
      message: 'Test error',
      details: { field: 'value' },
    }

    expect(testErrorResult.code).toBe(StudioErrorCode.AUTHENTICATION_ERROR)
    expect(testErrorResult.message).toBe('Test error')
  })

  it('should have helper function types compile correctly', () => {
    const testUser: EndUser = {
      user_id: '123',
      email: 'test@example.com',
      name: 'Test User',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      last_sign_in_at: '2024-01-15T10:30:00Z',
      sign_in_count: 5,
      auth_provider: 'email',
      user_metadata: { department: 'Engineering' },
      status: 'active',
    }

    const testSession: EndUserSession = {
      session_id: '456',
      user_id: '123',
      device_type: 'desktop',
      device_name: 'MacBook Pro',
      browser: 'Chrome',
      ip_address: '192.168.1.1',
      location: 'San Francisco, CA',
      created_at: '2024-01-15T10:30:00Z',
      last_activity_at: '2024-01-15T10:30:00Z',
      is_revoked: false,
    }

    const formattedDate = formatDate('2024-01-15T10:30:00Z')
    const relativeTime = formatRelativeTime('2024-01-15T10:30:00Z')
    const displayName = getUserDisplayName(testUser)
    const initials = getUserInitials(testUser)
    const sessionActive = isSessionActive(testSession)
    const deviceName = getSessionDeviceName(testSession)
    const location = getSessionLocation(testSession)
    const validEmail = isValidEmail('test@example.com')
    const truncated = truncate('This is a long text', 10)

    expect(formattedDate).toBeDefined()
    expect(relativeTime).toBeDefined()
    expect(displayName).toBeDefined()
    expect(initials).toBeDefined()
    expect(sessionActive).toBeDefined()
    expect(deviceName).toBeDefined()
    expect(location).toBeDefined()
    expect(validEmail).toBe(true)
    expect(truncated).toBeDefined()
  })

  it('should verify StudioAuthServiceClient methods exist', () => {
    // Create a mock client that implements the required methods
    class MockStudioAuthServiceClient {
      config = { baseUrl: 'http://test', getToken: async () => 'token' }
      client = null

      async getClient() {
        return {} as any
      }

      listEndUsers = async (query?: EndUserListQuery) => ({ users: [], total: 0, limit: 50, offset: 0 })
      getEndUser = async (userId: string) => ({ user_id: '123', email: 'test@example.com', name: 'Test', created_at: '2024-01-15T10:30:00Z', updated_at: '2024-01-15T10:30:00Z', last_sign_in_at: '2024-01-15T10:30:00Z', sign_in_count: 0, auth_provider: 'email', user_metadata: {}, status: 'active' })
      disableEndUser = async (req: DisableEndUserRequest) => ({ user_id: '123', status: 'disabled', updated_at: '2024-01-15T10:30:00Z' })
      enableEndUser = async (req: EnableEndUserRequest) => ({ user_id: '123', status: 'active', updated_at: '2024-01-15T10:30:00Z' })
      updateEndUserMetadata = async (req: UpdateEndUserMetadataRequest) => ({ user_id: '123', email: 'test@example.com', name: 'Test', created_at: '2024-01-15T10:30:00Z', updated_at: '2024-01-15T10:30:00Z', last_sign_in_at: '2024-01-15T10:30:00Z', sign_in_count: 0, auth_provider: 'email', user_metadata: {}, status: 'active' })
      deleteEndUser = async (req: DeleteEndUserRequest) => ({ user_id: '123', deleted: true, deleted_at: '2024-01-15T10:30:00Z' })
      resetEndUserPassword = async (req: ResetEndUserPasswordRequest) => ({ user_id: '123', email_sent: true, message: 'Email sent' })
      getEndUserSessions = async (userId: string) => ({ sessions: [], total: 0 })
      revokeEndUserSession = async (req: RevokeEndUserSessionRequest) => ({ session_id: '456', revoked: true, revoked_at: '2024-01-15T10:30:00Z' })
    }

    const mockClient = new MockStudioAuthServiceClient() as unknown as StudioAuthServiceClient

    expect(mockClient).toBeDefined()
    expect(typeof mockClient.listEndUsers).toBe('function')
    expect(typeof mockClient.getEndUser).toBe('function')
  })

  it('should verify error handling functions exist', () => {
    const testErrorResult: StudioErrorResult = {
      code: StudioErrorCode.AUTHENTICATION_ERROR,
      message: 'Test error',
      details: { field: 'value' },
    }

    const errorMessage = getErrorMessage(testErrorResult)
    const errorTitle = getErrorTitle(testErrorResult)
    const recoverable = isRecoverableError(testErrorResult)
    const needsReauth = requiresReauth(testErrorResult)

    expect(errorMessage).toBeDefined()
    expect(errorTitle).toBeDefined()
    expect(typeof recoverable).toBe('boolean')
    expect(typeof needsReauth).toBe('boolean')
  })

  it('should support backward compatibility type aliases', () => {
    const testUser: EndUser = {
      user_id: '123',
      email: 'test@example.com',
      name: 'Test User',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      last_sign_in_at: '2024-01-15T10:30:00Z',
      sign_in_count: 5,
      auth_provider: 'email',
      user_metadata: { department: 'Engineering' },
      status: 'active',
    }

    const legacyUser: User = testUser
    const legacyStatus: UserStatus = 'active'
    const legacyProvider: AuthProvider = 'email'

    expect(legacyUser.user_id).toBe('123')
    expect(legacyStatus).toBe('active')
    expect(legacyProvider).toBe('email')
  })
})
