# Migration Guides

This document provides step-by-step migration guides for upgrading between API and SDK versions.

## Overview

Migration guides help you upgrade your integration from one version to another. Each guide includes:

- Step-by-step instructions
- Code examples showing before/after changes
- Common issues and solutions
- Testing recommendations

## Available Migration Guides

### [v1 to v2 Migration Guide](#v1-to-v2-migration-guide)

The most common migration is from API v1 to v2. This guide covers all breaking changes and how to update your code.

---

## v1 to v2 Migration Guide

This guide helps you migrate from API v1 to v2. API v2 introduces several breaking changes designed to improve consistency, security, and developer experience.

### Prerequisites

Before starting the migration:

- **Time Estimate**: 1-4 hours depending on your integration complexity
- **API Access**: Ensure you have access to API v2 endpoints
- **Test Environment**: Use a test environment for validation
- **Dependencies**: Update SDK to version 2.x.x
- **Backup**: Backup your current integration code

### Breaking Changes Summary

| Change Category | Description | Impact |
|-----------------|-------------|--------|
| Response Structure | Unified response format with `data` wrapper | High |
| Field Names | Renamed fields for consistency | Medium |
| Authentication | Added X-API-Key header requirement | Medium |
| Error Format | Standardized error response structure | Low |
| Pagination | Consistent pagination across all endpoints | Low |
| DateTime Format | ISO 8601 with timezone | Low |

---

## Step 1: Update Authentication

### What Changed

API v2 requires an additional `X-API-Key` header alongside the Bearer token.

### v1 Authentication

```bash
curl -X GET "https://api.nextmavens.com/v1/organizations" \
  -H "Authorization: Bearer $TOKEN"
```

### v2 Authentication

```bash
curl -X GET "https://api.nextmavens.com/v2/organizations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-API-Key: $API_KEY"
```

### Migration Steps

1. **Generate API Key**
   - Log in to the NextMavens Developer Portal
   - Navigate to API Keys section
   - Create a new API key with appropriate scopes

2. **Update Your Code**

**TypeScript/Node.js:**
```typescript
// Before (v1)
const headers = {
  'Authorization': `Bearer ${token}`
};

// After (v2)
const headers = {
  'Authorization': `Bearer ${token}`,
  'X-API-Key': apiKey
};
```

**Python:**
```python
# Before (v1)
headers = {
    'Authorization': f'Bearer {token}'
}

# After (v2)
headers = {
    'Authorization': f'Bearer {token}',
    'X-API-Key': api_key
}
```

**Go:**
```go
// Before (v1)
req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

// After (v2)
req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
req.Header.Set("X-API-Key", apiKey)
```

---

## Step 2: Update Response Structure Parsing

### What Changed

API v2 uses a consistent response structure with a `data` wrapper and optional `pagination` object.

### v1 Response Structure

```json
{
  "organizations": [
    {
      "id": "org_123abc",
      "name": "Acme Corp",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### v2 Response Structure

```json
{
  "data": [
    {
      "organization_id": "org_123abc",
      "display_name": "Acme Corp",
      "metadata": {
        "created": "2024-01-15T10:30:00Z",
        "modified": "2024-01-20T14:22:00Z"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### Migration Steps

**TypeScript/Node.js:**
```typescript
// Before (v1)
interface V1Response {
  organizations: Array<{
    id: string;
    name: string;
    created_at: string;
  }>;
}

const response = await fetch('/v1/organizations');
const data: V1Response = await response.json();
data.organizations.forEach(org => {
  console.log(org.name);
});

// After (v2)
interface V2Response {
  data: Array<{
    organization_id: string;
    display_name: string;
    metadata: {
      created: string;
      modified: string;
    };
  }>;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

const response = await fetch('/v2/organizations');
const result: V2Response = await response.json();
result.data.forEach(org => {
  console.log(org.display_name);
});
```

**Python:**
```python
# Before (v1)
response = requests.get('/v1/organizations')
organizations = response.json()['organizations']
for org in organizations:
    print(org['name'])

# After (v2)
response = requests.get('/v2/organizations')
result = response.json()
organizations = result['data']
for org in organizations:
    print(org['display_name'])
```

---

## Step 3: Update Field Names

### What Changed

Many field names were renamed for consistency across the API.

### Common Field Name Changes

| v1 Field | v2 Field | Notes |
|----------|----------|-------|
| `id` | `organization_id` / `project_id` / `user_id` | Context-specific |
| `name` | `display_name` | More descriptive |
| `created_at` | `metadata.created` | Nested in metadata |
| `updated_at` | `metadata.modified` | Nested in metadata |
| `user_name` | `username` | Simplified |
| `email` | `contact.email` | Nested in contact object |
| `status` | `lifecycle.status` | Nested in lifecycle object |

### Migration Example

**TypeScript/Node.js:**
```typescript
// Before (v1)
interface OrganizationV1 {
  id: string;
  name: string;
  created_at: string;
  email: string;
}

function processOrganization(org: OrganizationV1) {
  console.log(org.id);
  console.log(org.name);
  console.log(org.created_at);
  console.log(org.email);
}

// After (v2)
interface OrganizationV2 {
  organization_id: string;
  display_name: string;
  metadata: {
    created: string;
    modified: string;
  };
  contact: {
    email: string;
  };
}

function processOrganization(org: OrganizationV2) {
  console.log(org.organization_id);
  console.log(org.display_name);
  console.log(org.metadata.created);
  console.log(org.contact.email);
}
```

**Python:**
```python
# Before (v1)
org = {
    'id': 'org_123',
    'name': 'Acme Corp',
    'created_at': '2024-01-15T10:30:00Z',
    'email': 'contact@acme.com'
}
print(org['id'], org['name'], org['created_at'], org['email'])

# After (v2)
org = {
    'organization_id': 'org_123',
    'display_name': 'Acme Corp',
    'metadata': {
        'created': '2024-01-15T10:30:00Z',
        'modified': '2024-01-20T14:22:00Z'
    },
    'contact': {
        'email': 'contact@acme.com'
    }
}
print(org['organization_id'], org['display_name'],
      org['metadata']['created'], org['contact']['email'])
```

---

## Step 4: Update Error Handling

### What Changed

API v2 uses a standardized error format with an array of errors.

### v1 Error Format

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

### v2 Error Format

```json
{
  "errors": [
    {
      "code": "USER_NOT_FOUND",
      "message": "User not found",
      "field": "userId",
      "retryable": false
    }
  ]
}
```

### Migration Steps

**TypeScript/Node.js:**
```typescript
// Before (v1)
interface V1Error {
  error: {
    code: string;
    message: string;
  };
}

try {
  const response = await fetch('/v1/users/123');
  if (!response.ok) {
    const error: V1Error = await response.json();
    throw new Error(error.error.message);
  }
} catch (err) {
  console.error('Error:', err);
}

// After (v2)
interface V2Error {
  errors: Array<{
    code: string;
    message: string;
    field?: string;
    retryable?: boolean;
  }>;
}

try {
  const response = await fetch('/v2/users/123');
  if (!response.ok) {
    const error: V2Error = await response.json();
    const firstError = error.errors[0];
    throw new Error(`${firstError.code}: ${firstError.message}`);
  }
} catch (err) {
  console.error('Error:', err);
}
```

**Python:**
```python
# Before (v1)
response = requests.get('/v1/users/123')
if not response.ok:
    error = response.json()
    raise Exception(error['error']['message'])

# After (v2)
response = requests.get('/v2/users/123')
if not response.ok:
    error = response.json()
    first_error = error['errors'][0]
    raise Exception(f"{first_error['code']}: {first_error['message']}")
```

---

## Step 5: Update Pagination

### What Changed

API v2 uses consistent pagination across all list endpoints with `limit` and `offset` parameters.

### v1 Pagination

```bash
GET /v1/organizations?page=1&per_page=50
```

### v2 Pagination

```bash
GET /v2/organizations?limit=50&offset=0
```

### Migration Steps

**TypeScript/Node.js:**
```typescript
// Before (v1)
async function getOrganizations(page: number, perPage: number) {
  const response = await fetch(
    `/v1/organizations?page=${page}&per_page=${perPage}`
  );
  return response.json();
}

// After (v2)
async function getOrganizations(limit: number, offset: number) {
  const response = await fetch(
    `/v2/organizations?limit=${limit}&offset=${offset}`
  );
  const result = await response.json();
  return {
    data: result.data,
    pagination: result.pagination
  };
}
```

**Python:**
```python
# Before (v1)
def get_organizations(page: int, per_page: int):
    response = requests.get(
        '/v1/organizations',
        params={'page': page, 'per_page': per_page}
    )
    return response.json()

# After (v2)
def get_organizations(limit: int, offset: int):
    response = requests.get(
        '/v2/organizations',
        params={'limit': limit, 'offset': offset}
    )
    result = response.json()
    return {
        'data': result['data'],
        'pagination': result['pagination']
    }
```

---

## Step 6: Update DateTime Format Handling

### What Changed

API v2 consistently uses ISO 8601 format with timezone information.

### v1 DateTime

```json
{
  "created_at": "2024-01-15T10:30:00Z"
}
```

### v2 DateTime

```json
{
  "metadata": {
    "created": "2024-01-15T10:30:00.000Z"
  }
}
```

### Migration Steps

Most date parsing libraries handle both formats automatically. However, ensure your code properly parses ISO 8601 with milliseconds.

**TypeScript/Node.js:**
```typescript
// Both formats work with Date constructor
const date1 = new Date("2024-01-15T10:30:00Z");
const date2 = new Date("2024-01-15T10:30:00.000Z");

// For consistent parsing, use a library
import { parseISO } from 'date-fns';
const date = parseISO(org.metadata.created);
```

**Python:**
```python
from datetime import datetime
from dateutil import parser

# Both formats work with dateutil
dt = parser.parse("2024-01-15T10:30:00Z")
dt = parser.parse("2024-01-15T10:30:00.000Z")
```

---

## Common Issues and Solutions

### Issue 1: Authentication Errors

**Problem:** `401 Unauthorized` or `403 Forbidden` after updating to v2

**Solution:**
- Ensure you're including both `Authorization: Bearer {token}` and `X-API-Key: {api_key}` headers
- Verify your API key has the required scopes
- Check that the API key is active (not revoked or expired)

### Issue 2: Field Not Found Errors

**Problem:** `undefined` or `null` when accessing fields

**Solution:**
- Update field names according to the mapping table above
- Check for nested objects (e.g., `metadata.created` instead of `created_at`)
- Use TypeScript interfaces or similar to catch type errors

### Issue 3: Response Parsing Errors

**Problem:** Cannot parse response data

**Solution:**
- Access data via `response.data` instead of top-level properties
- Handle the new `pagination` object if present
- Update your response type definitions

### Issue 4: Pagination Not Working

**Problem:** Pagination parameters not recognized

**Solution:**
- Use `limit` and `offset` instead of `page` and `per_page`
- Calculate offset: `offset = (page - 1) * limit`
- Check the `pagination` object in the response for total count

### Issue 5: DateTime Parsing Issues

**Problem:** Dates not parsing correctly

**Solution:**
- Ensure your date library handles ISO 8601 with milliseconds
- Use a robust date parsing library (e.g., `date-fns`, `dateutil`, `moment`)
- Handle timezone information properly

### Issue 6: Error Format Changes

**Problem:** Error handling code not working

**Solution:**
- Update error parsing to handle `errors` array instead of `error` object
- Check the `retryable` field to determine if you should retry
- Update error code references

---

## Testing Your Migration

### 1. Unit Tests

Update your unit tests to use v2 response structures:

```typescript
describe('Organization API v2', () => {
  it('should parse organization response correctly', () => {
    const mockResponse = {
      data: [{
        organization_id: 'org_123',
        display_name: 'Acme Corp',
        metadata: {
          created: '2024-01-15T10:30:00.000Z',
          modified: '2024-01-20T14:22:00.000Z'
        }
      }],
      pagination: {
        total: 1,
        limit: 50,
        offset: 0
      }
    };

    const org = parseOrganization(mockResponse.data[0]);
    expect(org.id).toBe('org_123');
    expect(org.name).toBe('Acme Corp');
  });
});
```

### 2. Integration Tests

Test against a test environment with API v2:

```typescript
describe('Organizations API Integration', () => {
  it('should fetch organizations with v2 API', async () => {
    const response = await fetch('/v2/organizations', {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'X-API-Key': testApiKey
      }
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
  });
});
```

### 3. Manual Testing Checklist

- [ ] Authentication works with both headers
- [ ] Can fetch and list resources
- [ ] Field names are correctly mapped
- [ ] Pagination works correctly
- [ ] Error responses parse correctly
- [ ] Date/times parse correctly
- [ ] All endpoints used by your app are tested

---

## Rollback Plan

If you encounter issues after migrating:

1. **Immediate Rollback**: Revert your code changes and switch back to v1 endpoints
2. **Investigate**: Check logs and error messages to identify the issue
3. **Fix**: Address the issue in a development environment
4. **Test**: Thoroughly test the fix
5. **Retry Migrate**: Attempt migration again

To switch back to v1:

```typescript
// Revert endpoint URLs
const response = await fetch('/v1/organizations', {
  headers: {
    'Authorization': `Bearer ${token}`
    // Remove X-API-Key header
  }
});
```

---

## SDK Migration

If you're using the NextMavens SDK, upgrade to version 2.x.x:

### Installation

```bash
# npm
npm install @nextmavens/sdk@^2.0.0

# yarn
yarn add @nextmavens/sdk@^2.0.0

# pnpm
pnpm add @nextmavens/sdk@^2.0.0
```

### Code Changes

```typescript
// Before (SDK v1.x)
import { Client } from '@nextmavens/sdk';
const client = new Client('api-key');

// After (SDK v2.x)
import { NextMavensClient } from '@nextmavens/sdk';
const client = new NextMavensClient({
  apiKey: 'api-key',
  apiVersion: 'v2' // optional, defaults to v2
});
```

---

## Support and Resources

### Documentation

- [API Versioning](./api-versioning.md) - Learn about API versioning
- [SDK Versioning](./sdk-versioning.md) - SDK semantic versioning
- [Breaking Change Policy](./breaking-change-policy.md) - What constitutes a breaking change
- [Deprecation Timeline](./deprecation-timeline.md) - Deprecation policy

### Tools

- [Version Discovery API](#) - Check available API versions
- [API Console](#) - Test v2 endpoints interactively
- [Migration Validator](#) - Validate your v2 integration

### Getting Help

- **Community Forum**: Ask questions in the developer community
- **Support Tickets**: Open a support ticket for migration assistance
- **Email**: migration-help@nextmavens.com
- **Office Hours**: Join weekly migration office hours (Thursdays 2-3pm PST)

---

## Checklist

Use this checklist to track your migration progress:

### Pre-Migration
- [ ] Read all breaking changes
- [ ] Estimate migration effort
- [ ] Set up test environment
- [ ] Backup current integration code
- [ ] Generate API key for v2

### Migration
- [ ] Update authentication headers
- [ ] Update response parsing
- [ ] Update field name references
- [ ] Update error handling
- [ ] Update pagination
- [ ] Update datetime handling
- [ ] Update all endpoint URLs

### Testing
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Manual testing checklist
- [ ] Load testing (if applicable)
- [ ] Security testing

### Deployment
- [ ] Deploy to staging environment
- [ ] Monitor for errors
- [ ] Deploy to production
- [ ] Monitor metrics
- [ ] Validate functionality

### Post-Migration
- [ ] Update documentation
- [ ] Train team members
- [ ] Remove old v1 code
- [ ] Update dependencies
- [ ] Close migration ticket

---

## Next Steps

After completing the migration:

1. **Monitor**: Keep an eye on error rates and performance metrics
2. **Optimize**: Take advantage of new v2 features
3. **Stay Updated**: Subscribe to changelog for future updates
4. **Provide Feedback**: Share your migration experience with us

For questions or issues during migration, don't hesitate to reach out to our support team.
