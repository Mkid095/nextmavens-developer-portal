# Deprecation Timeline

This document defines the deprecation policy for the NextMavens platform, ensuring developers have adequate time to migrate when features are deprecated or removed.

## Overview

Deprecation is a phased process that provides developers with advance notice before features are removed. This policy ensures that API and SDK changes are communicated clearly and that developers have sufficient time to update their integrations.

## Deprecation Timeline

### Breaking Changes: 6 Months Notice

When a breaking change is introduced, developers receive **6 months** of advance notice before the change becomes mandatory.

**Timeline:**
```
Month 0: Announcement     - New version released, old version deprecated
Month 1-5: Grace Period   - Both versions supported, migration encouraged
Month 6: Enforcement      - Old version sunset, new version required
```

**What Gets 6-Month Notice:**
- API endpoint removal or renaming
- Breaking changes to request/response schemas
- Required parameter changes
- Authentication or authorization changes
- SDK major version changes (e.g., 1.x → 2.0)

**Example:**
```
January 1, 2024:  API v2 released, v1 deprecated
July 1, 2024:    API v1 sunset (no longer supported)
```

### Feature Deprecations: 3 Months Notice

When a non-breaking feature is deprecated, developers receive **3 months** of advance notice.

**Timeline:**
```
Month 0: Announcement     - Feature marked as deprecated
Month 1-2: Grace Period   - Feature still works, deprecation warnings shown
Month 3: Removal          - Feature removed from platform
```

**What Gets 3-Month Notice:**
- Optional parameters or fields removed
- Non-essential SDK methods deprecated
- Non-breaking behavior changes
- API endpoints marked for removal (with alternatives available)

**Example:**
```
March 1, 2024:   `/legacy/endpoint` marked deprecated
June 1, 2024:    `/legacy/endpoint` removed
```

## Deprecation Indicators

### HTTP Headers

Deprecated endpoints return deprecation headers in all responses:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Link: <https://docs.nextmavens.com/migration/v1-to-v2>; rel="deprecation-guide"
```

**Header Fields:**
- `Deprecation: true` - Indicates the endpoint is deprecated
- `Sunset: <date>` - Date when the endpoint will be removed
- `Link: <url>; rel="deprecation-guide"` - Link to migration documentation

### Response Body Warnings

Deprecated endpoints include warning information in error responses:

```json
{
  "error": {
    "code": "DEPRECATED_ENDPOINT",
    "message": "This endpoint is deprecated and will be removed on 2024-12-31. Please migrate to /v2/organizations. See: https://docs.nextmavens.com/migration/v1-to-v2",
    "sunset_date": "2024-12-31T23:59:59Z",
    "migration_url": "https://docs.nextmavens.com/migration/v1-to-v2"
  }
}
```

### SDK Deprecation Warnings

SDK methods emit deprecation warnings at runtime:

```typescript
// TypeScript/JavaScript
const client = new NextMavensClient({ apiKey: 'xxx' });

// Console warning when using deprecated method
// ⚠️ WARNING: client.getOrganization() is deprecated and will be removed in v3.0.0.
// Use client.organizations.get() instead. Deprecated: 2024-01-01, Sunset: 2024-06-01.
await client.getOrganization('org_123');
```

```python
# Python
client = NextMavensClient(api_key='xxx')

# Console warning
# DeprecationWarning: get_organization() is deprecated and will be removed in v3.0.0.
# Use organizations.get() instead. Deprecated: 2024-01-01, Sunset: 2024-06-01.
client.get_organization('org_123')
```

## Deprecation Process

### Phase 1: Announcement (Day 0)

When a feature is deprecated:

1. **Official Announcement**
   - Blog post published announcing deprecation
   - Email sent to all affected developers
   - In-app notifications displayed in dashboard
   - Changelog updated with deprecation notice

2. **Documentation Updates**
   - Migration guide published
   - Code examples provided for new implementation
   - FAQ for common migration questions

3. **Runtime Warnings**
   - HTTP headers added to responses
   - SDK warnings emitted
   - Dashboard notifications shown

### Phase 2: Grace Period (Months 1-5 for Breaking, 1-2 for Features)

During the grace period:

1. **Both Versions Supported**
   - Old version continues to work
   - New version available and stable
   - Bugs fixed in both versions

2. **Migration Support**
   - Office hours for migration questions
   - Code review for migration PRs
   - Direct support for complex migrations

3. **Regular Reminders**
   - Monthly email reminders as sunset approaches
   - Dashboard countdown to sunset date
   - Progress tracking on migration completion

### Phase 3: Sunset (Month 6 for Breaking, Month 3 for Features)

At sunset:

1. **Feature Removal**
   - Old endpoint returns 410 Gone
   - Old SDK methods throw exceptions
   - Configuration options removed

2. **Final Communication**
   - Final notification sent 1 week before sunset
   - Sunset date confirmed in all channels

3. **Post-Sunset Support**
   - Emergency security patches only
   - No new features or bug fixes
   - Migration assistance still available

## API Version Deprecation Example

### Scenario: API v1 Sunset

**January 1, 2024 - API v2 Released, v1 Deprecated**

```bash
# Request to deprecated v1 endpoint
curl -X GET "https://api.nextmavens.com/v1/organizations" \
  -H "Authorization: Bearer $TOKEN"

# Response includes deprecation headers
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Link: <https://docs.nextmavens.com/migration/v1-to-v2>; rel="migration-guide"
```

**February - June 2024 - Grace Period**

- v1 continues to work
- Monthly migration reminder emails sent
- Dashboard shows: "API v1 deprecated. Migrate to v2 before December 31, 2024"

**December 1, 2024 - Final Notice (1 month before sunset)**

```bash
# Request still works, but final warning
curl -X GET "https://api.nextmavens.com/v1/organizations" \
  -H "Authorization: Bearer $TOKEN"

# Response includes urgency warning
{
  "warning": {
    "code": "IMMINENT_SUNSET",
    "message": "API v1 will be sunset on December 31, 2024. Please migrate to v2 immediately.",
    "days_remaining": 30
  }
}
```

**December 31, 2024 - Sunset**

```bash
# Request to sunset v1 endpoint
curl -X GET "https://api.nextmavens.com/v1/organizations" \
  -H "Authorization: Bearer $TOKEN"

# Response: 410 Gone
HTTP/1.1 410 Gone
{
  "error": {
    "code": "API_VERSION_SUNSET",
    "message": "API v1 has been sunset and is no longer available. Please use API v2. See: https://docs.nextmavens.com/migration/v1-to-v2"
  }
}
```

## SDK Method Deprecation Example

### Scenario: Method Rename

**March 1, 2024 - Method Deprecated**

```typescript
// TypeScript SDK v2.5.0
import { NextMavensClient } from '@nextmavens/sdk';

const client = new NextMavensClient({ apiKey: 'xxx' });

// Using deprecated method
await client.getOrganization('org_123');

// Console warning:
// ⚠️ WARNING: client.getOrganization() is deprecated and will be removed in v3.0.0 (estimated June 2024).
// Use client.organizations.get() instead.
// See: https://docs.nextmavens.com/sdk/migration/2.5-to-3.0
```

**March - May 2024 - Grace Period**

- Old method still works
- Each call emits deprecation warning
- Documentation updated with new examples

**June 1, 2024 - Removal (SDK v3.0.0)**

```typescript
// TypeScript SDK v3.0.0
import { NextMavensClient } from '@nextmavens/sdk';

const client = new NextMavensClient({ apiKey: 'xxx' });

// Old method no longer exists
await client.getOrganization('org_123');
// Error: client.getOrganization is not a function

// Must use new method
await client.organizations.get('org_123');
```

## Checking Deprecation Status

### Via API

Check if an endpoint is deprecated:

```bash
curl -X GET "https://api.nextmavens.com/v1/organizations" \
  -H "Authorization: Bearer $TOKEN" \
  -v

# Look for deprecation headers in response
< Deprecation: true
< Sunset: Sat, 31 Dec 2024 23:59:59 GMT
```

### Via Version Discovery API

Query the versions endpoint for deprecation status:

```bash
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

### Via Dashboard

The developer dashboard shows deprecation warnings:

1. **Project Settings** → **API Status**
   - Lists current API version
   - Shows deprecation warnings
   - Displays migration recommendations

2. **SDK Documentation**
   - Deprecated methods marked with ⚠️
   - Sunset dates displayed
   - Links to migration guides

## Migration Support

### Migration Guides

Every deprecation includes a comprehensive migration guide:

- Step-by-step instructions
- Code examples for old and new implementations
- Common pitfalls and solutions
- Estimated migration time

### Code Migration Tools

For major deprecations, we provide:

1. **Automated Migration Scripts**
   ```bash
   # Automatic code migration tool
   npx @nextmavens/migrate-v1-to-v2 ./src
   ```

2. **Codemods**
   ```bash
   # Use codemod for specific changes
   jscodeshift -t nextmavens-sdk-v3-codemod.ts src/
   ```

3. **Validation Tools**
   ```bash
   # Check for deprecated usage
   npx @nextmavens/deprecation-checker ./src
   ```

### Support Channels

During the grace period:

1. **Office Hours** - Weekly Q&A sessions for migration questions
2. **Slack/Discord** - Dedicated migration support channel
3. **Email Support** - Priority support for migration issues
4. **Code Review** - Free code review for migration PRs

## Best Practices for Developers

### Monitor Deprecations

1. **Subscribe to Announcements**
   - Join developer mailing list
   - Follow @NextMavensDev on Twitter
   - Watch GitHub repository releases

2. **Enable Runtime Warnings**
   - Ensure console warnings are visible in development
   - Set up logging to capture deprecation warnings
   - Configure error tracking to alert on deprecations

3. **Regular Audits**
   - Quarterly review of API usage
   - Check dashboard for deprecation notices
   - Run deprecation checker tools

### Plan Migrations Early

1. **Assess Impact**
   - Inventory all uses of deprecated features
   - Estimate migration effort
   - Identify blocking dependencies

2. **Schedule Migration**
   - Plan migration well before sunset date
   - Allocate dedicated time for testing
   - Schedule migration during low-traffic periods

3. **Test Thoroughly**
   - Test against new API/SDK in staging
   - Run integration tests with new version
   - Validate all functionality before deploying

### Stay Current

1. **Use Latest Stable Versions**
   - Keep SDKs updated to latest stable
   - Migrate to new API versions when available
   - Avoid waiting until sunset to migrate

2. **Participate in Beta Programs**
   - Test new API versions during beta
   - Provide feedback on breaking changes
   - Influence deprecation timeline

3. **Provide Feedback**
   - Comment on deprecation proposals
   - Request extensions if needed
   - Share migration pain points

## Emergency Deprecations

In rare cases, emergency deprecations may be necessary:

### Security Vulnerabilities

- Zero-day vulnerabilities may require immediate action
- Timeline: 72 hours notice (or immediate for critical issues)
- Emergency patches provided for affected versions
- Expedited migration support

### Legal or Compliance Issues

- Legal requirements may force immediate removal
- Timeline: As required by law
- Advance notice when possible
- Migration assistance provided

## Related Documentation

- [API Versioning](./api-versioning.md)
- [SDK Semantic Versioning](./sdk-versioning.md)
- [Breaking Change Policy](./breaking-change-policy.md)
- [Migration Guides](./migration-guides.md)
- [Version Changelog](./changelog.md)

## Support

For questions about deprecations:
- Review the migration guide for the deprecated feature
- Check the dashboard for active deprecations
- Contact support for assistance with migrations
- Join the developer community for migration help

## Timeline Summary

| Change Type | Notice Period | Examples |
|-------------|---------------|----------|
| **Breaking Changes** | 6 months | API version sunset, SDK major version, endpoint removal |
| **Feature Deprecations** | 3 months | Optional parameter removal, non-essential methods |
| **Emergency** | 72 hours | Security vulnerabilities, legal requirements |
| **Bug Fixes** | No notice | Backward-compatible fixes, no migration needed |
