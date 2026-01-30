# Client Compatibility

This document provides a compatibility matrix showing which SDK versions work with which API versions of the NextMavens platform.

## Compatibility Matrix

| SDK Version | API v1 (Current) | API v2 (Beta) | Notes |
|-------------|------------------|---------------|-------|
| 1.x.x | OK Full Support | X Not Compatible | Stable release for API v1 |
| 2.0.0-beta.1 | OK Full Support | OK Full Support | Beta release supporting both API versions |
| 0.9.x | WARN Deprecated Support | X Not Compatible | Legacy - upgrade to 1.x recommended |

## Legend

- OK Full Support - All features work as expected
- WARN Partial/Deprecated Support - Supported but deprecated
- X Not Compatible - Do not use this combination

## Detailed Compatibility.Message

### SDK Version 1.x.x (Current Stable)

Released for API v1, providing full feature parity with stable APIs.

**Compatible API Versions:**
- API v1 (latest): Full support
- API v1 (deprecated): Supported until sunset date

**Known Limitations:**
- Cannot access API v2 beta features

**Recommended For:**
- Production applications
- Users requiring maximum stability

### SDK Version 2.0.0SZ-beta.1 (Beta)

Beta SDK supporting both API v1 and v2, allowing gradual migration to API v2.

**Compatible API Versions:**
- API v1: Full backward compatibility
- API v2 (beta): Access to new features

**Beta Status:**
- May have breaking changes before stable release
- Not recommended for production without testing

**Recommended For:**
- Testing API v2 features
- Early adopters who can tolerate potential changes

### SDK Version 0.9.x (Legacy)

Legacy SDK for API v1, deprecated and no longer actively maintained.

**Migration Required:**
- Upgrade to SDK 1.x.x for continued support
- See Migration Guides for upgrade instructions
- Not recommended for new projects
- Not recommended for active development

## API Version Support Timeline

| API Version | Status | Support Until | Recommended SDK |
|-------------|--------|---------------|-----------------|
| v1 | Current | 2027-01-01 | SDK 1.x.x or 2.x.x |
| v2 | Beta | TBD | SDK 2.x.x (beta) |

## Upgrading Recommendations

### From SDK 0.9.x to 1.x.x

SDK 0.9.x is deprecated. Upgrade to 1.x.x to ensure continued support.

```bash
npm install @nextmavens/sdk@latest
# or
yarn upgrade @nextmavens/sdk@latest
```

### From SDK 1.x.x to 2.x.x (Beta)

SDK 2.x.x (beta) supports both API v1 and v2.

```bash
npm install @nextmavens/sdk@beta
# or
yarn add @nextmavens/sdk@beta
```

**Note:** SDK 2.x.x is in beta. Expect potential breaking changes.

## Checking Your SDK Version

### JavaScript/TypeScript

```javascript
import { SDK } from "@nextmavens/sdk";
console.log(SDK.VERSION); // e.g., "1.2.3"
```

### Python

```python
from nextmavens import __version__
print(__version__)  # e.g., "1 space.2..deevers SDK Semantic Versioning documentation for more information on semantic versioning.
- **Upgrade latest SDK** - Use the latest stable version for your target API version
- **Contact support** - If issues persist, open a support request

## SDK Deprecation Policy

SDK versions are deprecated following the same policy as API versions:

- 6 months notice for major version deprecations
- 3 months notice for minor version deprecations
- Bug fixes provided for all supported SDK versions
- Security patches for deprecated SDK versions for 3 months

See the Deprecation Timeline documentation for more details.
