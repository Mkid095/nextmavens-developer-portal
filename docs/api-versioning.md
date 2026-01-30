# API Versioning

This document describes how API versioning works in the NextMavens platform, enabling developers to understand how APIs evolve and how to integrate with versioned endpoints.

## Overview

API versioning provides stability and predictability for API consumers. When breaking changes are necessary, we release a new API version while maintaining backward compatibility with existing versions for a defined period.

## Versioning Approaches

The NextMavens platform supports two complementary versioning approaches:

### 1. URL Path Versioning (Primary)

The primary versioning mechanism uses version prefixes in the URL path:

```
https://api.nextmavens.com/v1/organizations
https://api.nextmavens.com/v2/organizations
```

**Benefits:**
- Clear and explicit versioning in the URL
- Easy to route requests to different API implementations
- Simple to document and understand
- Works well with API gateways and load balancers

**Usage:**
```bash
# v1 API request
curl -H "Authorization: Bearer $TOKEN" \
  https://api.nextmavens.com/v1/organizations

# v2 API request
curl -H "Authorization: Bearer $TOKEN" \
  https://api.nextmavens.com/v2/organizations
```

### 2. Header-Based Versioning (Alternate)

For clients that cannot modify URL paths, we support version specification via headers:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  -H "API-Version: 2" \
  https://api.nextmavens.com/organizations
```

**Header Options:**
- `API-Version: 1` - Use API v1
- `API-Version: 2` - Use API v2

**Default Behavior:**
- If no version header is provided, the latest stable version is used
- URL path versioning takes precedence over header versioning
- Header versioning is primarily for backward compatibility with legacy clients

## When Versions Change

### Major Version Changes

A new major version (v1, v2, v3, etc.) is released when **breaking changes** are introduced:

**Breaking Changes Include:**
- Removing or renaming API endpoints
- Changing required request parameters
- Modifying response data structures in incompatible ways
- Changing field types (e.g., string to number)
- Removing response fields
- Changing authentication or authorization requirements
- Altering error response formats

**Non-Breaking Changes (Do NOT Require New Version):**
- Adding new optional request parameters
- Adding new response fields
- Adding new endpoints
- Fixing bugs in existing endpoints
- Improving documentation
- Performance optimizations

### Version Lifecycle

```
Current Stable → Deprecated → Sunset
      ↓              ↓            ↓
   Active         6-month      1-year
   Support       Notice       Support
```

1. **Current Stable** - The latest stable version, recommended for new integrations
2. **Deprecated** - Still supported but will be sunset; developers should migrate
3. **Sunset** - No longer supported; only emergency security patches

### Version Release Process

When a breaking change is needed:

1. **New Major Version** - Create vX+1 with breaking changes
2. **Maintain vX** - Keep previous version stable for existing consumers
3. **Announce Deprecation** - Notify developers of future sunset (6-month notice)
4. **Support Period** - Provide 1 year of support after next major release
5. **Sunset** - Remove version after support period ends

## Versioned Request Examples

### Example 1: Organizations API

**v1 Request:**
```bash
curl -X GET "https://api.nextmavens.com/v1/organizations" \
  -H "Authorization: Bearer $TOKEN"
```

**v1 Response:**
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

**v2 Request (with breaking changes):**
```bash
curl -X GET "https://api.nextmavens.com/v2/organizations" \
  -H "Authorization: Bearer $TOKEN"
```

**v2 Response (different structure):**
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

### Example 2: Using Header Versioning

```bash
# Request v2 via header
curl -X GET "https://api.nextmavens.com/organizations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "API-Version: 2"
```

This is equivalent to the URL path versioning approach but uses headers instead.

### Example 3: Version Discovery

```bash
# Discover available versions
curl -X GET "https://api.nextmavens.com/versions" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "versions": [
    {
      "version": "2",
      "status": "current",
      "url": "https://api.nextmavens.com/v2",
      "released_at": "2024-01-01T00:00:00Z"
    },
    {
      "version": "1",
      "status": "deprecated",
      "url": "https://api.nextmavens.com/v1",
      "sunset_at": "2024-12-31T23:59:59Z",
      "migration_guide": "https://docs.nextmavens.com/migration/v1-to-v2"
    }
  ]
}
```

## Response Headers

All API responses include version information in headers:

```http
HTTP/1.1 200 OK
Content-Type: application/json
API-Version: 2
X-API-Version: 2
```

For deprecated versions, additional headers are included:

```http
HTTP/1.1 200 OK
Content-Type: application/json
API-Version: 1
X-API-Version: 1
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Link: <https://docs.nextmavens.com/migration/v1-to-v2>; rel="migration-guide"
```

## Best Practices

### For API Consumers

1. **Pin to Specific Versions** - Always specify the API version you're integrating with
2. **Monitor Deprecation Notices** - Watch for deprecation headers and announcements
3. **Test Migration Paths** - Test upgrades against the next API version before it becomes stable
4. **Update Regularly** - Keep your integration updated to the latest stable version
5. **Handle Version Errors Gracefully** - Implement fallback logic if an unsupported version is requested

### For API Producers

1. **Semantic Versioning** - Follow semantic versioning principles (MAJOR.MINOR.PATCH)
2. **Clear Documentation** - Document all breaking changes in detail
3. **Migration Guides** - Provide step-by-step migration guides between versions
4. **Deprecation Timeline** - Give developers adequate time to migrate (minimum 6 months)
5. **Backward Compatibility** - Maintain backward compatibility within major versions

## SDK Version Compatibility

SDKs are versioned independently but align with API versions:

| SDK Version | Compatible API Versions | Notes |
|-------------|------------------------|-------|
| 1.x.x | v1 only | Legacy SDK, use v2+ for new projects |
| 2.x.x | v1, v2 | Supports both v1 and v2 APIs |
| 3.x.x | v2 only | Requires API v2+ |

See [SDK Versioning](./sdk-versioning.md) for more details.

## Related Documentation

- [SDK Semantic Versioning](./sdk-versioning.md)
- [Deprecation Timeline](./deprecation-timeline.md)
- [Breaking Change Policy](./breaking-change-policy.md)
- [Migration Guides](./migration-guides.md)
- [Version Discovery API](./version-discovery.md)

## Support

For questions about API versioning:
- Review the migration guides for version-specific changes
- Check the API changelog for version history
- Contact support for assistance with migrations
