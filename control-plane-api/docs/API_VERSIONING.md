# API Versioning

## Overview

The Control Plane API uses URL-based versioning to provide a stable interface for clients while allowing for future evolution.

## Current Version

**Version:** `1.0.0`

**Base URL:** `/v1/`

All API endpoints are prefixed with the version number, e.g.:
- `GET /v1/projects` - List projects
- `POST /v1/keys` - Create API key
- `GET /v1/audit` - Query audit logs

## Version Headers

Every API response includes an `X-API-Version` header indicating the API version:

```
X-API-Version: 1.0.0
```

Clients should read this header to:
1. Track which version of the API they're using
2. Detect when the API version changes
3. Prepare for future deprecations

## Deprecation Policy

When a new API version is released:

1. **Announcement Period:** Old versions will be supported for at least 6 months after deprecation
2. **Deprecation Headers:** Deprecated versions will include:
   - `X-API-Deprecation`: Warning message about deprecation
   - `X-Sunset`: Date when the deprecated version will be removed

Example:
```
X-API-Version: 1.0.0
X-API-Deprecation: This version is deprecated. Please migrate to v2 by 2025-12-01.
X-Sunset: 2025-12-01
```

## Version Differences

### v1.0.0 (Current)

Initial release of the Control Plane API. Includes:
- Projects CRUD
- Organizations management
- API Keys management
- Usage and Quotas
- Jobs API
- Audit Logs
- Webhooks
- Health Check

### Future Versions

When breaking changes are required, a new major version will be released (e.g., `v2.0.0`).

## Migration Guide

When upgrading between API versions:

1. Review the changelog for breaking changes
2. Update your base URL to the new version
3. Update request/response handling for any schema changes
4. Test thoroughly in development before production deployment

## Best Practices

1. **Don't hardcode versions:** Use the `X-API-Version` header to detect API version
2. **Handle deprecation warnings:** Log `X-API-Deprecation` headers when present
3. **Prepare for sunset dates:** Upgrade before the sunset date
4. **Test new versions:** Use a test environment to validate API changes

## Support

For questions about API versioning:
- Review this documentation
- Check the API changelog
- Contact support for migration assistance
