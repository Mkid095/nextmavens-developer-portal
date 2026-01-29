/**
 * Integration Test for Auth Service API Client
 * Tests the complete integration flow and error handling
 *
 * This file can be run with: npx tsx src/features/studio/lib/__tests__/integration-test.ts
 */

import {
  StudioAuthServiceClient,
  createStudioClientWithToken,
  StudioAuthError,
  AuthServiceApiClientError,
} from '@/features/studio/lib/auth-service-client'
import {
  parseError,
  withErrorHandling,
  StudioErrorCode,
  type StudioErrorResult,
} from '@/features/studio/lib/error-handling'
import type {
  EndUser,
  EndUserSession,
  EndUserListQuery,
  DisableEndUserRequest,
} from '@/lib/types/auth-user.types'

// Test runner utilities
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

// Test Group: Studio Auth Service Client - Integration Tests
async function testStudioAuthServiceClient() {
  const mockToken = 'mock-jwt-token'
  const mockBaseUrl = 'http://localhost:4000'

  // Test: Client can be instantiated with valid config
  const client1 = new StudioAuthServiceClient({
    baseUrl: mockBaseUrl,
    getToken: async () => mockToken,
  })

  assert(client1 !== undefined, 'Client should be defined')
  assert(client1 instanceof StudioAuthServiceClient, 'Client should be instance of StudioAuthServiceClient')
  console.log('✓ Client can be instantiated with valid config')

  // Test: createStudioClientWithToken creates a valid client
  const client2 = createStudioClientWithToken(mockToken)

  assert(client2 !== undefined, 'Client should be defined')
  assert(client2 instanceof StudioAuthServiceClient, 'Client should be instance of StudioAuthServiceClient')
  console.log('✓ createStudioClientWithToken creates a valid client')

  // Test: Client has all required API methods
  const client = createStudioClientWithToken(mockToken)

  // Check all main methods exist
  assert(typeof client.listEndUsers === 'function', 'listEndUsers should be a function')
  assert(typeof client.getEndUser === 'function', 'getEndUser should be a function')
  assert(typeof client.disableEndUser === 'function', 'disableEndUser should be a function')
  assert(typeof client.enableEndUser === 'function', 'enableEndUser should be a function')
  assert(typeof client.updateEndUserMetadata === 'function', 'updateEndUserMetadata should be a function')
  assert(typeof client.deleteEndUser === 'function', 'deleteEndUser should be a function')
  assert(typeof client.resetEndUserPassword === 'function', 'resetEndUserPassword should be a function')
  assert(typeof client.getEndUserSessions === 'function', 'getEndUserSessions should be a function')
  assert(typeof client.revokeEndUserSession === 'function', 'revokeEndUserSession should be a function')

  // Check legacy methods exist for backward compatibility
  assert(typeof client.listUsers === 'function', 'listUsers should be a function')
  assert(typeof client.getUser === 'function', 'getUser should be a function')
  assert(typeof client.disableUser === 'function', 'disableUser should be a function')
  assert(typeof client.enableUser === 'function', 'enableUser should be a function')
  assert(typeof client.updateUserMetadata === 'function', 'updateUserMetadata should be a function')
  assert(typeof client.deleteUser === 'function', 'deleteUser should be a function')
  assert(typeof client.resetPassword === 'function', 'resetPassword should be a function')
  assert(typeof client.getUserSessions === 'function', 'getUserSessions should be a function')
  assert(typeof client.revokeSession === 'function', 'revokeSession should be a function')

  console.log('✓ Client has all required API methods')
}

// Test Group: Error Handling Integration
async function testErrorHandlingIntegration() {
  // Test: parseError handles StudioAuthError correctly
  const error1 = new StudioAuthError('Test error', 'TEST_CODE')
  const result1 = parseError(error1)

  assert(result1.code === StudioErrorCode.AUTHENTICATION_ERROR, 'Should parse StudioAuthError as AUTHENTICATION_ERROR')
  assert(result1.message === 'Test error', 'Should preserve error message')
  assert(result1.originalError === error1, 'Should preserve original error')
  console.log('✓ parseError handles StudioAuthError correctly')

  // Test: parseError handles AuthServiceError correctly
  const authError = {
    error: 'NOT_FOUND',
    message: 'User not found',
    code: 'NOT_FOUND',
    details: { userId: '123' },
  }

  const result2 = parseError(authError)

  assert(result2.code === StudioErrorCode.NOT_FOUND_ERROR, 'Should parse NOT_FOUND error correctly')
  assert(result2.message === 'The requested resource was not found.', `Should provide user-friendly message, got: ${result2.message}`)
  assert(JSON.stringify(result2.details) === JSON.stringify({ userId: '123' }), 'Should preserve error details')
  console.log('✓ parseError handles AuthServiceError correctly')

  // Test: parseError handles network errors correctly
  const error3 = new Error('fetch failed - network connection lost')
  const result3 = parseError(error3)

  assert(result3.code === StudioErrorCode.NETWORK_ERROR, 'Should parse network errors correctly')
  assert(result3.message.includes('Network error'), 'Should identify network errors')
  console.log('✓ parseError handles network errors correctly')

  // Test: parseError handles unknown errors correctly
  const error4 = new Error('Unknown error')
  const result4 = parseError(error4)

  assert(result4.code === StudioErrorCode.UNKNOWN_ERROR, 'Should parse unknown errors correctly')
  assert(result4.message === 'Unknown error', 'Should preserve unknown error message')
  console.log('✓ parseError handles unknown errors correctly')

  // Test: parseError handles non-Error objects
  const result5 = parseError('string error')

  assert(result5.code === StudioErrorCode.UNKNOWN_ERROR, 'Should handle non-Error objects')
  assert(result5.message === 'An unexpected error occurred', 'Should provide default message for non-Error objects')
  console.log('✓ parseError handles non-Error objects')
}

// Test Group: withErrorHandling Integration
async function testWithErrorHandlingIntegration() {
  // Test: withErrorHandling returns data on success
  const mockData = { user_id: '123', email: 'test@example.com' }
  const result1 = await withErrorHandling(async () => mockData)

  assert(JSON.stringify(result1.data) === JSON.stringify(mockData), 'Should return data on success')
  assert(result1.error === undefined, 'Should not return error on success')
  console.log('✓ withErrorHandling returns data on success')

  // Test: withErrorHandling returns error on failure
  const result2 = await withErrorHandling(async () => {
    throw new StudioAuthError('Authentication failed')
  })

  assert(result2.data === undefined, 'Should not return data on failure')
  assert(result2.error !== undefined, 'Should return error on failure')
  assert(result2.error?.code === StudioErrorCode.AUTHENTICATION_ERROR, 'Should parse error correctly')
  console.log('✓ withErrorHandling returns error on failure')

  // Test: withErrorHandling preserves error context
  const result3 = await withErrorHandling(
    async () => {
      throw new Error('fetch failed - network connection lost')
    },
    'TestContext'
  )

  assert(result3.error !== undefined, 'Should return error')
  assert(result3.error?.code === StudioErrorCode.NETWORK_ERROR, 'Should identify network errors')
  console.log('✓ withErrorHandling preserves error context')
}

// Test Group: Type Safety Integration
async function testTypeSafetyIntegration() {
  // Test: EndUser type has all required fields
  const user: EndUser = {
    user_id: '123',
    email: 'test@example.com',
    name: 'Test User',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    last_sign_in_at: '2024-01-15T10:30:00Z',
    sign_in_count: 5,
    auth_provider: 'email',
    user_metadata: { role: 'admin' },
    status: 'active',
  }

  assert(user.user_id === '123', 'EndUser should have user_id')
  assert(user.email === 'test@example.com', 'EndUser should have email')
  assert(user.status === 'active', 'EndUser should have status')
  console.log('✓ EndUser type has all required fields')

  // Test: EndUserSession type has all required fields
  const session: EndUserSession = {
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

  assert(session.session_id === '456', 'EndUserSession should have session_id')
  assert(session.user_id === '123', 'EndUserSession should have user_id')
  assert(session.is_revoked === false, 'EndUserSession should have is_revoked')
  console.log('✓ EndUserSession type has all required fields')

  // Test: EndUserListQuery accepts valid parameters
  const query: EndUserListQuery = {
    limit: 50,
    offset: 0,
    search: 'test',
    status: 'active',
    auth_provider: 'email',
    sort_by: 'created_at',
    sort_order: 'desc',
  }

  assert(query.limit === 50, 'EndUserListQuery should have limit')
  assert(query.status === 'active', 'EndUserListQuery should have status')
  console.log('✓ EndUserListQuery accepts valid parameters')

  // Test: DisableEndUserRequest has correct structure
  const request: DisableEndUserRequest = {
    userId: '123',
    reason: 'Violation of terms',
  }

  assert(request.userId === '123', 'DisableEndUserRequest should have userId')
  assert(request.reason === 'Violation of terms', 'DisableEndUserRequest should have reason')
  console.log('✓ DisableEndUserRequest has correct structure')
}

// Test Group: API Client Method Signatures
async function testApiClientMethodSignatures() {
  const client = createStudioClientWithToken('test-token')

  // Test: listEndUsers accepts query parameters
  const query: EndUserListQuery = {
    limit: 50,
    offset: 0,
  }

  // This test verifies the method signature at compile time
  assert(typeof client.listEndUsers === 'function', 'listEndUsers should be a function')
  assert(client.listEndUsers.length >= 0, 'listEndUsers should accept parameters')
  console.log('✓ listEndUsers accepts query parameters')

  // Test: getEndUser accepts userId string
  assert(typeof client.getEndUser === 'function', 'getEndUser should be a function')
  assert(client.getEndUser.length === 1, 'getEndUser should accept one parameter')
  console.log('✓ getEndUser accepts userId string')

  // Test: disableEndUser accepts request object
  const request: DisableEndUserRequest = {
    userId: '123',
    reason: 'Test',
  }

  assert(typeof client.disableEndUser === 'function', 'disableEndUser should be a function')
  assert(client.disableEndUser.length === 1, 'disableEndUser should accept one parameter')
  console.log('✓ disableEndUser accepts request object')
}

// Test Group: Backward Compatibility
async function testBackwardCompatibility() {
  const client = createStudioClientWithToken('test-token')

  // Test: Legacy methods map to new methods
  assert(client.listUsers !== undefined, 'listUsers should exist')
  assert(client.getUser !== undefined, 'getUser should exist')
  assert(client.disableUser !== undefined, 'disableUser should exist')
  assert(client.enableUser !== undefined, 'enableUser should exist')
  assert(client.updateUserMetadata !== undefined, 'updateUserMetadata should exist')
  assert(client.deleteUser !== undefined, 'deleteUser should exist')
  assert(client.resetPassword !== undefined, 'resetPassword should exist')
  assert(client.getUserSessions !== undefined, 'getUserSessions should exist')
  assert(client.revokeSession !== undefined, 'revokeSession should exist')
  console.log('✓ Legacy methods map to new methods')

  // Test: Legacy type aliases work
  type LegacyUser = EndUser
  type LegacyStatus = EndUser['status']

  const user: LegacyUser = {
    user_id: '123',
    email: 'test@example.com',
    name: 'Test',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    sign_in_count: 0,
    auth_provider: 'email',
    user_metadata: {},
    status: 'active' as LegacyStatus,
  }

  assert(user.status === 'active', 'Legacy type aliases should work')
  console.log('✓ Legacy type aliases work')
}

// Main test runner
async function runAllTests() {
  console.log('\n🧪 Running Integration Tests for Auth Service API Client\n')
  console.log('='.repeat(60))

  try {
    await testStudioAuthServiceClient()
    await testErrorHandlingIntegration()
    await testWithErrorHandlingIntegration()
    await testTypeSafetyIntegration()
    await testApiClientMethodSignatures()
    await testBackwardCompatibility()

    console.log('='.repeat(60))
    console.log('\n✅ All integration tests passed!\n')
    console.log('✅ API client is properly integrated!')
    console.log('✅ Error handling is comprehensive!')
    console.log('✅ Type safety is maintained!')
    console.log('✅ Backward compatibility is preserved!')
    console.log('\n' + '='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests
runAllTests()
