# Auth Service API Integration

This document describes the integration between the Developer Portal and the Auth Service API for user management operations.

## Overview

The Developer Portal integrates with the Auth Service to provide centralized user management capabilities through the Studio interface. This integration allows developers to manage end-users of their applications.

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  Developer Portal   │         │   Auth Service       │
│  (Studio UI)        │────────▶│   (User Management)  │
│                     │  API    │                      │
└─────────────────────┘         └──────────────────────┘
         │                               │
         │                               │
         ▼                               ▼
   Developer Users              End-Users (Application Users)
```

## Environment Configuration

### Required Environment Variables

```bash
# Auth Service Configuration
AUTH_SERVICE_URL=http://localhost:3001
AUTH_SERVICE_API_KEY=your_auth_service_api_key_here
```

### Security Notes

- **AUTH_SERVICE_API_KEY**: This is the developer portal's service token for authenticating with the auth service
- Never commit API keys to version control
- Use different keys for development, staging, and production environments
- Rotate keys regularly and implement key revocation procedures

## API Client Usage

### Base Auth Service Client

The base client (`@/lib/api/auth-service-client.ts`) provides direct access to the auth service API.

```typescript
import { createAuthServiceClient } from '@/lib/api/auth-service-client'

// Create client instance
const client = createAuthServiceClient()

// List users with pagination
const users = await client.listEndUsers({
  limit: 50,
  offset: 0,
  status: 'active',
  sort_by: 'created_at',
  sort_order: 'desc'
})

// Get specific user
const user = await client.getEndUser('user-id-here')
```

### Studio Auth Service Client

The Studio client (`@/features/studio/lib/auth-service-client.ts`) provides a wrapper that handles developer portal authentication.

```typescript
import { createStudioClientWithToken } from '@/features/studio/lib/auth-service-client'

// Create client with developer portal token
const client = createStudioClientWithToken(developerPortalToken)

// Use the same API methods
const users = await client.listEndUsers({ search: 'john@example.com' })
```

## API Endpoints

### User Management

#### List End-Users

```typescript
async listEndUsers(query?: EndUserListQuery): Promise<EndUserListResponse>
```

**Query Parameters:**
- `limit?: number` - Number of users to return (default: 50)
- `offset?: number` - Pagination offset (default: 0)
- `search?: string` - Search by email address
- `status?: 'active' | 'disabled' | 'deleted'` - Filter by status
- `auth_provider?: 'email' | 'google' | 'github' | 'microsoft'` - Filter by provider
- `created_after?: string` - ISO 8601 date filter
- `created_before?: string` - ISO 8601 date filter
- `last_sign_in_after?: string` - ISO 8601 date filter
- `last_sign_in_before?: string` - ISO 8601 date filter
- `sort_by?: 'created_at' | 'last_sign_in_at' | 'email' | 'name'` - Sort field
- `sort_order?: 'asc' | 'desc'` - Sort direction

**Response:**
```typescript
{
  users: EndUser[]
  total: number
  limit: number
  offset: number
}
```

#### Get End-User

```typescript
async getEndUser(userId: string): Promise<EndUserDetailResponse>
```

**Response:**
```typescript
{
  user_id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  sign_in_count: number
  auth_provider: 'email' | 'google' | 'github' | 'microsoft'
  user_metadata: Record<string, unknown>
  status: 'active' | 'disabled' | 'deleted'
}
```

#### Update End-User Metadata

```typescript
async updateEndUserMetadata(request: {
  userId: string
  metadata: Record<string, unknown>
}): Promise<EndUserDetailResponse>
```

### User Status Management

#### Disable End-User

```typescript
async disableEndUser(request: {
  userId: string
  reason?: string
}): Promise<EndUserStatusResponse>
```

**Response:**
```typescript
{
  user_id: string
  status: 'disabled'
  updated_at: string
}
```

#### Enable End-User

```typescript
async enableEndUser(request: {
  userId: string
}): Promise<EndUserStatusResponse>
```

#### Delete End-User

```typescript
async deleteEndUser(request: {
  userId: string
  reason?: string
}): Promise<DeleteEndUserResponse>
```

**Response:**
```typescript
{
  user_id: string
  deleted: true
  deleted_at: string
}
```

### Password Management

#### Reset Password

```typescript
async resetEndUserPassword(request: {
  userId: string
  email?: string
}): Promise<ResetEndUserPasswordResponse>
```

**Response:**
```typescript
{
  user_id: string
  email_sent: boolean
  message: string
}
```

**Note:** This sends a password reset email to the user's email address.

### Session Management

#### Get End-User Sessions

```typescript
async getEndUserSessions(userId: string): Promise<EndUserSessionsResponse>
```

**Response:**
```typescript
{
  sessions: EndUserSession[]
  total: number
}
```

**Session Object:**
```typescript
{
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
```

#### Revoke Session

```typescript
async revokeEndUserSession(request: {
  userId: string
  sessionId: string
}): Promise<RevokeEndUserSessionResponse>
```

**Response:**
```typescript
{
  session_id: string
  revoked: true
  revoked_at: string
}
```

## Error Handling

### Error Types

All API errors are caught and transformed into `StudioErrorResult` objects:

```typescript
interface StudioErrorResult {
  code: StudioErrorCode
  message: string
  details?: Record<string, unknown>
  originalError?: Error
}
```

### Error Codes

- `NETWORK_ERROR` - Connection issues with auth service
- `AUTHENTICATION_ERROR` - Invalid or missing developer portal token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid request parameters
- `NOT_FOUND_ERROR` - User or resource not found
- `CONFLICT_ERROR` - Resource already exists
- `RATE_LIMIT_ERROR` - Too many requests
- `SERVER_ERROR` - Auth service internal error
- `UNKNOWN_ERROR` - Unexpected error

### Error Handling Utilities

```typescript
import {
  withErrorHandling,
  parseError,
  getErrorMessage,
  getErrorTitle,
  isRecoverableError,
  requiresReauth
} from '@/features/studio/lib/error-handling'

// Wrap operations with automatic error handling
const result = await withErrorHandling(
  () => client.getEndUser('user-id'),
  'getUserOperation'
)

if (result.error) {
  console.error(getErrorTitle(result.error))
  console.error(getErrorMessage(result.error))

  if (requiresReauth(result.error)) {
    // Redirect to login
  }

  if (isRecoverableError(result.error)) {
    // Allow retry
  }
}
```

## Security Best Practices

### 1. Token Management

- **DO**: Use the Studio auth service client which handles token management
- **DON'T**: Store tokens in localStorage (XSS risk)
- **DO**: Implement token refresh logic
- **DON'T**: Hardcode tokens in source code

### 2. Input Validation

All inputs are validated at the API level. The client uses TypeScript types to ensure type safety:

```typescript
import type {
  EndUserListQuery,
  DisableEndUserRequest,
  UpdateEndUserMetadataRequest
} from '@/lib/types/auth-user.types'

// Type-safe requests
const query: EndUserListQuery = {
  limit: 50,
  status: 'active' // TypeScript will validate this
}
```

### 3. Error Messages

The error handling system prevents information leakage:

- Generic error messages for authentication failures
- No distinction between "user not found" and "wrong password" scenarios
- Sensitive details only logged server-side, not exposed to clients

### 4. Session Security

- Sessions are tracked with device information and IP addresses
- Admins can revoke specific sessions
- Active sessions are checked for recent activity (30-day window)

### 5. Audit Trail

All destructive operations (disable, delete, revoke) include optional `reason` fields for audit purposes.

## Helper Utilities

The API client includes helper utilities for displaying user data:

```typescript
import {
  formatDate,
  formatRelativeTime,
  getUserDisplayName,
  getUserInitials,
  isSessionActive,
  getSessionDeviceName,
  getSessionLocation,
  isValidEmail,
  truncate
} from '@/features/studio/lib/api-helpers'

// Format dates for display
formatDate(user.created_at) // "Jan 15, 2024, 10:30 AM"
formatRelativeTime(user.last_sign_in_at) // "2 hours ago"

// User display helpers
getUserDisplayName(user) // "John Doe" or "john@example.com"
getUserInitials(user) // "JD" or "JO"

// Session helpers
isSessionActive(session) // true/false
getSessionDeviceName(session) // "Chrome - desktop - MacBook Pro"
getSessionLocation(session) // "San Francisco, CA" or "192.168.1.1"

// Validation
isValidEmail('user@example.com') // true
truncate('Long text here...', 10) // "Long tex..."
```

## Migration Notes

### Legacy Method Names

The client supports legacy method names for backward compatibility:

| New Method | Legacy Method |
|------------|---------------|
| `listEndUsers` | `listUsers` |
| `getEndUser` | `getUser` |
| `disableEndUser` | `disableUser` |
| `enableEndUser` | `enableUser` |
| `updateEndUserMetadata` | `updateUserMetadata` |
| `deleteEndUser` | `deleteUser` |
| `resetEndUserPassword` | `resetPassword` |
| `getEndUserSessions` | `getUserSessions` |
| `revokeEndUserSession` | `revokeSession` |

**Note:** Legacy methods are marked as `@deprecated` and will be removed in future versions.

## Type Exports

All necessary types are exported from `@/lib/types/auth-user.types.ts`:

```typescript
// User types
import type {
  EndUser,
  EndUserStatus,
  EndUserAuthProvider
} from '@/lib/types/auth-user.types'

// Request/Response types
import type {
  EndUserListQuery,
  EndUserListResponse,
  EndUserDetailResponse,
  DisableEndUserRequest,
  EnableEndUserRequest,
  UpdateEndUserMetadataRequest,
  DeleteEndUserRequest,
  ResetEndUserPasswordRequest
} from '@/lib/types/auth-user.types'

// Session types
import type {
  EndUserSession,
  EndUserSessionsResponse,
  RevokeEndUserSessionRequest
} from '@/lib/types/auth-user.types'

// Error types
import type {
  AuthServiceError
} from '@/lib/types/auth-user.types'
```

## Testing

Integration tests are available in:
- `/home/ken/developer-portal/src/features/studio/lib/__tests__/auth-service-client.test.ts`

Run tests to verify type safety:
```bash
pnpm run typecheck
```

## Troubleshooting

### Common Issues

1. **AUTH_SERVICE_API_KEY not set**
   - Ensure the environment variable is set in `.env.local`
   - Check that the key is valid for the auth service

2. **Network errors**
   - Verify `AUTH_SERVICE_URL` is correct
   - Check that the auth service is running
   - Ensure firewall/network rules allow connections

3. **Authentication failures**
   - Verify the developer portal token is valid
   - Check token hasn't expired
   - Ensure token has required permissions

4. **Type errors**
   - Run `pnpm run typecheck` to identify issues
   - Ensure all imports use `@/` aliases, not relative paths

## Support

For issues or questions:
- Check the auth service API documentation
- Review error messages and codes
- Contact the platform team for authentication issues
