# Client Compatibility

This document provides a compatibility matrix showing which SDK versions work with which API versions.

## Compatibility Matrix

| SDK Version | API v1 (Current) | API v2 (Beta) | Notes |
|-------------|------------------|---------------|-------|
| 1.x.x | OK Full Support | X Not Compatible | Stable release |
| 2.0.0-beta.1 | OK Full Support | OK Full Support | Beta release |
| 0.9.x | WARN Deprecated | X Not Compatible | Legacy version |

## Legend

- OK - All features work
- WARN - Deprecated but functional
- X - Not compatible

## SDK Version Details

### SDK 1.x.x (Current)

Released for API v1 with full feature parity.

- API v1: Full support
- Cannot access API v2 beta features
- Recommended for production

### SDK 2.0.0-beta.1 (Beta)

Supports both API v1 and v2.

- API v1: Backward compatible
- API v2: New features available
- Beta status may have breaking changes

### SDK 0.9.x (Legacy)

Deprecated and unmaintained.

- Upgrade to 1.x.x required
- Not for new projects

## Upgrading

From 0.9.x to 1.x.x:
```bash
npm install @nextmavens/sdk@latest
```

From 1.x.x to 2.x.x (beta):
```bash
npm install @nextmavens/sdk@beta
```

## Support Timeline

| API Version | Status | Support Until |
|-------------|--------|---------------|
| v1 | Current | 2027-01-01 |
| v2 | Beta | TBD |

## Deprecation Policy

- 6 months notice for major version deprecations
- 3 months notice for minor version deprecations
- Bug fixes for all supported versions
- Security patches for 3 months post-deprecation

