# Version Headers

This document describes the HTTP headers used for API version identification and deprecation communication in the NextMavens platform.

## Overview

Version headers enable clients and servers to communicate about API versions explicitly. These headers help with:

- Identifying which API version a client intends to use
- Communicating which API version served a response
- Alerting clients to deprecated or sunset API versions
- Providing migration guidance for deprecated versions

## Request Headers

### X-API-Version

The `X-API-Version` header allows clients to specify their desired API version when using header-based versioning.

**Header Name:** `X-API-Version`

**Valid Values:** `1`, `2`, `3`, etc. (integer version numbers)

**Optional:** Yes - if not provided, the latest stable version is used

**Example:**
```http
GET /organizations HTTP/1.1
Host: api.nextmavens.com
Authorization: Bearer your_token_here
X-API-Version: 2
```

**Behavior:**
- When present, the API will attempt to route the request to the specified version
- If the requested version is not supported, a `400 Bad Request` or `410 Gone` response is returned
- URL path versioning (e.g., `/v2/organizations`) takes precedence over this header
- If both URL path and header specify versions, the URL path version is used

**Error Response (Unsupported Version):**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "unsupported_version",
  "message": "API version 5 is not supported. Current versions: 1, 2, 3",
  "supported_versions": [1, 2, 3]
}
```

## Response Headers

### API-Version

The `API-Version` header is included in all API responses to indicate which version served the response.

**Header Name:** `API-Version`

**Valid Values:** `1`, `2`, `3`, etc. (integer version numbers)

**Always Present:** Yes

**Example:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
API-Version: 2
```

**Usage:**
- Clients should log or store this header to verify they're communicating with the expected API version
- Useful for debugging integration issues
- Helps detect if a proxy or middleware is routing requests unexpectedly

### X-API-Version

The `X-API-Version` header is an alternative response header that also indicates the API version. It is provided for backward compatibility and is synonymous with `API-Version`.

**Header Name:** `X-API-Version`

**Valid Values:** `1`, `2`, `3`, etc. (integer version numbers)

**Always Present:** Yes

**Example:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
API-Version: 2
X-API-Version: 2
```

**Note:** Both `API-Version` and `X-API-Version` are included in responses for maximum compatibility. New integrations should use `API-Version`.

## Deprecation Headers

When an API version is deprecated or sunset, additional headers are included in responses to inform clients.

### Deprecation

The `Deprecation` header indicates that the API version being used is deprecated.

**Header Name:** `Deprecation`

**Valid Values:** `true`

**Present When:** API version is deprecated but still supported

**Example:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
API-Version: 1
X-API-Version: 1
Deprecation: true
```

**Client Action:**
- Plan migration to the current stable version
- Refer to the migration guide for upgrade instructions
- Monitor announcements for sunset date updates

### Sunset

The `Sunset` header specifies the date and time when the API version will be discontinued.

**Header Name:** `Sunset`

**Valid Values:** HTTP-date format (RFC 1123)

**Present When:** API version is deprecated or sunset

**Example:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
API-Version: 1
X-API-Version: 1
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
```

**Client Action:**
- Complete migration before the sunset date
- Set up monitoring to track migration progress
- Contact support if migration assistance is needed

### Link (Migration Guide)

The `Link` header provides a URL to the migration guide for deprecated API versions.

**Header Name:** `Link`

**Valid Values:** URL with `rel="migration-guide"` parameter

**Present When:** API version is deprecated

**Example:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
API-Version: 1
X-API-Version: 1
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Link: <https://docs.nextmavens.com/migration/v1-to-v2>; rel="migration-guide"
```

**Client Action:**
- Follow the link to access detailed migration instructions
- Review breaking changes and code examples
- Test migration in a development environment

## Complete Header Examples

### Current Stable Version Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
API-Version: 2
X-API-Version: 2
```

### Deprecated Version Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
API-Version: 1
X-API-Version: 1
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Link: <https://docs.nextmavens.com/migration/v1-to-v2>; rel="migration-guide"; type="text/html"
```

### Sunset Version Response

```http
HTTP/1.1 410 Gone
Content-Type: application/json
API-Version: 1
X-API-Version: 1
Sunset: Sat, 01 Jan 2024 00:00:00 GMT
Link: <https://docs.nextmavens.com/migration/v1-to-v2>; rel="migration-guide"; type="text/html"

{
  "error": "version_sunset",
  "message": "API v1 has been sunset. Please migrate to v2.",
  "migration_guide": "https://docs.nextmavens.com/migration/v1-to-v2"
}
```

## Error Response Headers

Error responses also include version headers for consistency:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
API-Version: 2
X-API-Version: 2

{
  "error": "invalid_request",
  "message": "Missing required parameter: organization_id"
}
```

## Version Header Best Practices

### For API Consumers

1. **Log Response Headers** - Store or log the `API-Version` header from responses for debugging
2. **Monitor Deprecation** - Watch for the `Deprecation` header and take action when detected
3. **Plan Migration** - Use the `Sunset` header to schedule migration work
4. **Follow Migration Guides** - Use the `Link` header to access migration documentation
5. **Specify Request Version** - Use `X-API-Version` header when URL path versioning is not possible

### For API Producers

1. **Always Include Version Headers** - Every response must include `API-Version` and `X-API-Version`
2. **Provide Early Warning** - Set `Deprecation` header as soon as a version is marked deprecated
3. **Set Clear Sunset Dates** - Provide specific sunset dates using the `Sunset` header
4. **Link to Migration Guides** - Include `Link` header with migration guide URL
5. **Maintain Header Consistency** - Ensure headers are present in all responses (success and error)

## Header Implementation Example

### Node.js (Fetch)

```javascript
const response = await fetch('https://api.nextmavens.com/organizations', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-API-Version': '2'
  }
});

// Check version headers
const apiVersion = response.headers.get('API-Version');
const isDeprecated = response.headers.get('Deprecation') === 'true';
const sunsetDate = response.headers.get('Sunset');

if (isDeprecated) {
  console.warn(`API ${apiVersion} is deprecated. Sunset: ${sunsetDate}`);
  // Log migration alert
}
```

### Python (requests)

```python
import requests

response = requests.get(
    'https://api.nextmavens.com/organizations',
    headers={
        'Authorization': f'Bearer {token}',
        'X-API-Version': '2'
    }
)

# Check version headers
api_version = response.headers.get('API-Version')
is_deprecated = response.headers.get('Deprecation') == 'true'
sunset_date = response.headers.get('Sunset')

if is_deprecated:
    print(f'Warning: API {api_version} is deprecated. Sunset: {sunset_date}')
    # Log migration alert
```

### cURL

```bash
# Make request with version header
curl -X GET "https://api.nextmavens.com/organizations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-API-Version: 2" \
  -v

# Check response headers (verbose mode shows headers)
# Look for: API-Version, X-API-Version, Deprecation, Sunset, Link
```

## Header Compliance Checklist

When implementing API clients:

- [ ] Include `X-API-Version` header in requests (if using header-based versioning)
- [ ] Read `API-Version` header from responses
- [ ] Detect `Deprecation: true` header and log warnings
- [ ] Parse `Sunset` header and schedule migration before date
- [ ] Follow `Link` header to migration guide when deprecated
- [ ] Log or store version headers for debugging
- [ ] Handle unsupported version errors gracefully

## Related Documentation

- [API Versioning](./api-versioning.md) - Overview of API versioning approaches
- [Deprecation Timeline](./deprecation-timeline.md) - Deprecation policy and timelines
- [Breaking Change Policy](./breaking-change-policy.md) - What constitutes a breaking change
- [Migration Guides](./migration-guides.md) - Step-by-step migration instructions

## Support

For questions about version headers:
- Review the API versioning documentation for header usage
- Check the deprecation timeline for version support dates
- Contact support for assistance with version migration
