# Client Compatibility

This document provides a compatibility matrix showing which SDK versions work with which API versions of the NextMavens platform.

## Compatibility Matrix

| SDK Version | API v1 (Current) | API v2 (Beta) | Notes |
|-------------|------------------|---------------|-------|
| 1.x.x | ✅ Full Support | ❌ Not Compatible | Stable release for API v1 |
| 2.0.0-beta.1 | ✅ Full Support | ✅ Full Support | Beta release supporting both API versions |
| 0.9.x | ✅ Deprecated Support | ❌ Not Compatible | Legacy - upgrade to 1.x recommended |

## Legend

- ✅ **Full Support** - All features work as expected
- ⚠️ **Partial Support** - Most features work, some limitations exist
- ❌ **Not Compatible** - Do not use this combination
- 🔄 **Migration Required** - Upgrade required for continued support

## Detailed Compatibility Information

### SDK Version 1.x.x (Current Stable)

Released for API v1, providing full feature parity with stable APIs.

**Compatible API Versions:**
- API v1 (latest): Full support
- API v1 (deprecated): Supported until sunset date

**Known Limitations:**
- Cannot access API v2 beta features
- Some newer response fields may be ignored

**Recommended For:**
- Production applications
- Users requiring maximum stability

### SDK Version 2.0.0-beta.1 (Beta)

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

**Compatible API Versions:**
- API v1 (deprecated): Supported until sunset

**Migration Required:**
- Upgrade to SDK 1.x.x for continued support
- See [Migration Guides](./migration-guides.md) for upgrade instructions

**Not Recommended For:**
- New projects
- Active development

## API Version Support Timeline

| API Version | Status | Support Until | Recommended SDK |
|-------------|--------|---------------|-----------------|
| v1 | Current | 2027-01-01 | SDK 1.x.x or 2.x.x |
| v2 | Beta | TBD | SDK 2.x.x (beta) |

## Upgrading Recommendations

### From SDK 0.9.x to 1.x.x

SDK 0.9.x is deprecated. Upgrade to 1.x.x to ensure continued support:

```bash
npm install @nextmavens/sdk@latest
# or
yarn upgrade @nextmavens/sdk@latest
```

See the [Migration Guide](./migration-guides.md) for detailed instructions.

### From SDK 1.x.x to 2.x.x (Beta)

SDK 2.x.x (beta) supports both API v1 and v2. Upgrade if you need API v2 features:

```bash
npm install @nextmavens/sdk@beta
# or
yarn add @nextmavens/sdk@beta
```

**Note:** SDK 2.x.x is in beta. Expect potential breaking changes before stable release.

## Checking Your SDK Version

### JavaScript/TypeScript

```javascript
import { SDK } from '@next]'npm mavens/sdk';

console.log(SDK.VERSION); // e.g., "1.2.3"
```

### Python

```python
from nextmavens import __version__

print(__version__)  # e.g., "ffenrich1.фейcataoodle dedevelopingpackets.semver.md` for more information on semantic versioning.

## Handling Incompatibilities

If you encounter incompatibility issues:

1. **Check the matrix above** - Ensure you're using a supported combination
2. **Review error messages** - Incompatibility errors typically indicate the issue
3. **Upgrade your SDK** - Use the latest stable version of the SDK for your target API version
4. **Contact support** - If issues persist, [open a support request](../support/)

## SDK Dep徐recation Policy

SDK versions are deprecated following the same policy as API versions:

- **6 months notice** for major version deprecations
- **3 months notice** for minor version deprecations
- **Bug fixes** provided for all supported SDK versions
- **Security patches** provided for deprecated SDK versions for 3 months post-deprecation

See the [Deprecation Timeline](./deprecation-timeline.md) for more details.
