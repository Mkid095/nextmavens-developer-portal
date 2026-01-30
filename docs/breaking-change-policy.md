# Breaking Change Policy

This document defines what constitutes a breaking change in the NextMavens platform, provides examples of breaking and non-breaking changes, and outlines the process for introducing breaking changes.

## Overview

A **breaking change** is any modification that could cause existing client code or integrations to fail or behave differently without updates. We take breaking changes seriously and follow a structured process to minimize disruption to developers.

## What Constitutes a Breaking Change

### API Breaking Changes

#### 1. Removed or Renamed Endpoints

Removing an endpoint or changing its URL path breaks existing integrations.

**Example (Breaking):**
```http
# Before (v1)
GET /v1/users/{id}

# After (v2) - endpoint removed, use new endpoint
GET /v2/accounts/{id}
```

#### 2. Changed Request Parameters

Modifying required parameters, parameter names, or data types breaks existing requests.

**Example (Breaking - Parameter Renamed):**
```http
# Before (v1)
POST /v1/users
{
  "user_name": "john_doe",
  "email": "john@example.com"
}

# After (v2) - parameter renamed
POST /v2/users
{
  "username": "john_doe",  // was "user_name"
  "email_address": "john@example.com"  // was "email"
}
```

**Example (Breaking - Parameter Type Changed):**
```http
# Before (v1)
POST /v1/organizations
{
  "max_seats": "100"  // string
}

# After (v2) - type changed to number
POST /v2/organizations
{
  "max_seats": 100  // number, must be numeric
}
```

**Example (Breaking - Optional to Required):**
```http
# Before (v1)
POST /v1/projects
{
  "name": "My Project",
  "description": "Optional description"
}

# After (v2) - description now required
POST /v2/projects
{
  "name": "My Project",
  "description": "Required description"  // now required
}
```

#### 3. Changed Response Schemas

Modifying response structure in incompatible ways breaks client code that parses responses.

**Example (Breaking - Field Renamed):**
```json
// Before (v1)
{
  "user_id": "123",
  "full_name": "John Doe",
  "created": "2024-01-01T00:00:00Z"
}

// After (v2) - fields renamed
{
  "id": "123",           // was "user_id"
  "name": "John Doe",    // was "full_name"
  "createdAt": "2024-01-01T00:00:00Z"  // was "created"
}
```

**Example (Breaking - Structure Changed):**
```json
// Before (v1)
{
  "users": [
    {"id": "1", "name": "Alice"},
    {"id": "2", "name": "Bob"}
  ]
}

// After (v2) - wrapped in data object
{
  "data": {
    "users": [
      {"id": "1", "name": "Alice"},
      {"id": "2", "name": "Bob"}
    ]
  }
}
```

**Example (Breaking - Field Removed):**
```json
// Before (v1)
{
  "id": "123",
  "name": "John Doe",
  "status": "active",    // removed in v2
  "email": "john@example.com"
}

// After (v2) - status field removed
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### 4. Changed Field Types

Changing the data type of a field breaks clients expecting specific types.

**Example (Breaking - String to Number):**
```json
// Before (v1)
{
  "balance": "100.50",    // string
  "currency": "USD"
}

// After (v2)
{
  "balance": 100.50,      // number
  "currency": "USD"
}
```

**Example (Breaking - Object to Array):**
```json
// Before (v1)
{
  "tags": {
    "priority": "high",
    "status": "active"
  }
}

// After (v2)
{
  "tags": ["priority", "status"]  // changed to array
}
```

#### 5. Changed Authentication/Authorization

Altering auth requirements breaks existing authentication flows.

**Example (Breaking - Auth Method Changed):**
```http
# Before (v1)
Authorization: Bearer {token}

# After (v2) - requires API key in header
X-API-Key: {api_key}
Authorization: Bearer {token}
```

**Example (Breaking - Scope Requirements):**
```http
# Before (v1)
# OAuth scope: read:users

# After (v2) - different scope required
# OAuth scope: users:read
```

#### 6. Changed Error Response Formats

Modifying error response structures breaks error handling code.

**Example (Breaking - Error Format Changed):**
```json
// Before (v1)
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}

// After (v2)
{
  "errors": [
    {
      "code": "USER_NOT_FOUND",
      "message": "User not found",
      "field": "userId"
    }
  ]
}
```

#### 7. Changed HTTP Status Codes

Using different status codes for the same scenarios breaks client error handling.

**Example (Breaking):**
```http
# Before (v1)
POST /v1/users
# Returns: 201 Created on success

# After (v2)
POST /v2/users
# Returns: 200 OK on success (different status)
```

#### 8. Changed Default Values

Changing default behavior breaks clients relying on previous defaults.

**Example (Breaking - Pagination Default):**
```http
# Before (v1)
GET /v1/users
# Default: limit=100 (returns up to 100 users)

# After (v2)
GET /v2/users
# Default: limit=20 (returns up to 20 users)
```

## Examples of Non-Breaking Changes

The following changes do NOT require a new API version and can be released within the same major version:

### 1. Adding New Optional Parameters

```http
# Existing endpoint
POST /v1/users
{
  "name": "John Doe"
}

# Add optional parameter - non-breaking
POST /v1/users
{
  "name": "John Doe",
  "phone": "+1-555-0123"  // new optional parameter
}
```

### 2. Adding New Response Fields

```json
// Existing response
{
  "id": "123",
  "name": "John Doe"
}

// Add new field - non-breaking
{
  "id": "123",
  "name": "John Doe",
  "created_at": "2024-01-01T00:00:00Z"  // new field
}
```

### 3. Adding New Endpoints

```http
# New endpoint - doesn't affect existing endpoints
GET /v1/users/{id}/settings
```

### 4. Bug Fixes

Fixing bugs in existing endpoints without changing the API contract.

```http
# Bug fix: correct calculation error
# Before: returned incorrect total count
# After: returns correct count (non-breaking fix)
GET /v1/reports/summary
```

### 5. Performance Improvements

Optimizing response times or query performance without changing API contract.

### 6. Documentation Updates

Improving documentation, examples, or descriptions.

### 7. Adding New Optional Headers

```http
# New optional header for request tracking
GET /v1/users
X-Request-ID: unique-id
```

### 8. Relaxed Validation

Making validation less strict is generally non-breaking:

```http
# Before: strictly requires email format
# After: allows any string (more permissive)
```

### 9. Adding Enum Values

```json
// Before
{
  "status": "active" | "inactive"
}

// After - added new value (non-breaking for clients)
{
  "status": "active" | "inactive" | "pending"
}
```

## Process for Introducing Breaking Changes

### 1. Evaluation and Planning

Before introducing a breaking change:

- **Assess Impact**: Identify which clients and integrations are affected
- **Consider Alternatives**: Explore if the change can be made non-breaking
- **Estimate Migration Effort**: Determine complexity for developers to migrate
- **Review Timeline**: Ensure adequate time for migration

### 2. Design the New Version

When creating a new major version:

- **Version Number**: Increment the major version (v1 → v2)
- **Parallel Support**: Maintain the old version alongside the new version
- **Clear Documentation**: Document all breaking changes in detail
- **Migration Guide**: Provide step-by-step migration instructions

### 3. Announcement Process

Follow the deprecation timeline:

1. **Announce Early**: Provide at least 6 months notice before deprecating a version
2. **Deprecation Headers**: Mark deprecated endpoints with appropriate headers
3. **Communication Channels**: Announce through:
   - API changelog
   - Email notifications to registered developers
   - In-app notifications
   - Documentation banners
4. **Migration Support**: Provide support during migration period

### 4. Release Process

When releasing the new version:

1. **Beta Period**: Release new version as beta for testing
2. **Documentation**: Ensure complete documentation is available
3. **Examples**: Provide code examples showing changes
4. **Migration Guide**: Publish detailed migration guide
5. **Feedback Loop**: Collect feedback from early adopters

### 5. Support Period

After releasing a new major version:

- **Maintain Old Version**: Keep the previous version stable for 1 year
- **Security Patches**: Apply security patches to deprecated versions
- **Bug Fixes**: Critical bugs may be fixed at discretion
- **Monitoring**: Monitor usage of deprecated versions

### 6. Sunset Process

When sunsetting a version:

1. **Final Notice**: Provide 3-month final notice before shutdown
2. **Redirect**: Redirect deprecated endpoints to documentation
3. **Graceful Errors**: Return helpful error messages with migration links
4. **Complete Shutdown**: Remove version after support period ends

## Breaking Change Checklist

Use this checklist when planning a breaking change:

### Planning Phase
- [ ] Impact analysis completed
- [ ] Affected endpoints identified
- [ ] Migration complexity assessed
- [ ] Alternative solutions considered
- [ ] Release timeline established

### Development Phase
- [ ] New version implemented
- [ ] Backward compatibility maintained (old version)
- [ ] Tests written for new version
- [ ] Documentation updated
- [ ] Migration guide created

### Announcement Phase
- [ ] 6-month notice provided
- [ ] Deprecation headers added
- [ ] Changelog updated
- [ ] Notifications sent to users
- [ ] Support documentation published

### Release Phase
- [ ] Beta testing completed
- [ ] New version marked stable
- [ ] Old version marked deprecated
- [ ] Migration guide published
- [ ] Support channels ready

### Sunset Phase
- [ ] 1-year support period completed
- [ ] Final 3-month notice sent
- [ ] User migration confirmed
- [ ] Version shutdown scheduled
- [ ] Version removed from service

## Examples: Complete Breaking Change Scenarios

### Scenario 1: Endpoint Renamed

**v1:**
```http
GET /v1/members/{id}
```

**v2:**
```http
GET /v2/users/{id}
```

**Migration:**
- Update endpoint URL from `/members/` to `/users/`
- Response structure unchanged

### Scenario 2: Authentication Changed

**v1:**
```http
Authorization: Bearer {token}
```

**v2:**
```http
X-API-Key: {api_key}
Authorization: Bearer {token}
```

**Migration:**
- Add `X-API-Key` header in addition to bearer token
- Obtain API key from developer portal

### Scenario 3: Response Restructured

**v1 Response:**
```json
{
  "user_id": "123",
  "user_name": "John Doe",
  "user_email": "john@example.com"
}
```

**v2 Response:**
```json
{
  "id": "123",
  "name": "John Doe",
  "contact": {
    "email": "john@example.com"
  }
}
```

**Migration:**
- Update field names: `user_id` → `id`, `user_name` → `name`
- Access email via nested path: `contact.email`

## Best Practices for Minimizing Breaking Changes

### 1. Add, Don't Remove

When possible, add new fields/endpoints instead of removing old ones:

```json
// Instead of renaming, keep both fields
{
  "user_name": "John Doe",    // deprecated but still present
  "name": "John Doe"          // new preferred field
}
```

### 2. Use Feature Flags

Introduce breaking changes behind feature flags:

```http
GET /v1/users?include_v2_schema=true
```

### 3. Versioned Contracts

Use versioned contracts in request/response:

```http
POST /v1/users
Content-Type: application/json; version=2
```

### 4. Gradual Migration

Support multiple formats during transition:

```json
{
  "user": {     // v1 format (deprecated)
    "id": "123",
    "name": "John"
  },
  "account": {  // v2 format (preferred)
    "accountId": "123",
    "displayName": "John"
  }
}
```

### 5. Request Validation

Validate requests based on client version:

```http
POST /v1/users
X-Client-Version: 2.0.0
```

## Related Documentation

- [API Versioning](./api-versioning.md) - How API versioning works
- [Deprecation Timeline](./deprecation-timeline.md) - Deprecation policy and timelines
- [Migration Guides](./migration-guides.md) - Step-by-step migration instructions
- [SDK Versioning](./sdk-versioning.md) - SDK semantic versioning
- [Changelog](./changelog.md) - Version history and changes

## Support

For questions about breaking changes or migration:
- Review the migration guides for detailed instructions
- Check the API changelog for version-specific changes
- Contact support for assistance with your migration

## Feedback

If you have suggestions for improving our breaking change process or need help with a migration, please contact our support team or open an issue in our developer community.
