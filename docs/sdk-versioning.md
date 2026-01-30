# SDK Semantic Versioning

This document explains how SDK versioning works in the NextMavens platform, enabling developers to manage dependencies effectively.

## Overview

NextMavens SDKs follow [Semantic Versioning (SemVer)](https://semver.org/), a standardized versioning scheme that communicates the impact of changes through version numbers: **MAJOR.MINOR.PATCH**.

```
MAJOR.MINOR.PATCH
  ^    ^     ^
  |    |     |
  |    |     +-- PATCH: Bug fixes (backward compatible)
  |    +-------- MINOR: New features (backward compatible)
  +------------- MAJOR: Breaking changes (not backward compatible)
```

## Semantic Versioning Components

### MAJOR Version (X.0.0)

Incremented when **breaking changes** are introduced that require existing code to be modified.

**Breaking Changes Include:**
- Removed or renamed classes, methods, or functions
- Changed method signatures (parameter types, order, or removal)
- Modified return types in incompatible ways
- Changed behavior of existing methods in non-compatible ways
- Moved or renamed namespaces/packages
- Changed default values that affect behavior
- Removed configuration options

**Example:**
```
1.5.0 → 2.0.0 (Breaking: Removed deprecated `authenticate()` method)
```

### MINOR Version (0.X.0)

Incremented when **backward-compatible** new features are added.

**New Features Include:**
- New classes, methods, or functions
- New optional parameters to existing methods
- New configuration options
- New functionality that doesn't break existing code

**Example:**
```
2.1.0 → 2.2.0 (Feature: Added `refreshToken()` method)
```

### PATCH Version (0.0.X)

Incremented for **backward-compatible** bug fixes.

**Bug Fixes Include:**
- Fixed incorrect behavior
- Fixed crashes or errors
- Performance improvements that don't change behavior
- Documentation fixes
- Typos in error messages

**Example:**
```
2.2.0 → 2.2.1 (Fix: Corrected token expiration parsing bug)
```

## Version Examples

| Version | Type | Description |
|---------|------|-------------|
| `1.0.0` → `1.0.1` | Patch | Fixed bug in request serialization |
| `1.0.1` → `1.1.0` | Minor | Added retry logic for failed requests |
| `1.1.0` → `2.0.0` | Major | Renamed `Client` to `NextMavensClient` |

## Compatibility Guarantees

### Within Major Versions (e.g., 2.x.x)

**Full backward compatibility is maintained:**
- All PATCH and MINOR updates are backward compatible
- Code written for 2.0.0 will work with 2.5.0 without modifications
- Deprecation warnings are provided before removing features
- 6-month notice for any deprecations

**Upgrade Example (Safe):**
```typescript
// Works in 2.0.0, 2.1.0, 2.2.0, etc.
import { Client } from '@nextmavens/sdk';

const client = new Client({ apiKey: 'xxx' });
await client.organizations.list();
```

### Across Major Versions (e.g., 1.x.x → 2.x.x)

**Breaking changes may require code modifications:**
- Review the migration guide for version-specific changes
- Update your code to use new APIs
- Remove usage of deprecated features
- Test thoroughly after upgrading

**Upgrade Example (Breaking Change):**
```typescript
// 1.x.x
import { Client } from '@nextmavens/sdk';
const client = new Client('api-key'); // Positional argument

// 2.0.0 (Breaking change)
import { NextMavensClient } from '@nextmavens/sdk';
const client = new NextMavensClient({ apiKey: 'api-key' }); // Config object
```

## Dependency Management

### Specifying Versions

**Recommended: Use Caret Range (^)**
```json
{
  "dependencies": {
    "@nextmavens/sdk": "^2.3.0"
  }
}
```
- Accepts 2.3.0 and any compatible version >= 2.3.0, < 3.0.0
- Example: 2.3.0, 2.3.1, 2.4.0, 2.10.0 are acceptable
- 3.0.0 would NOT be installed automatically (breaking changes)

**For Maximum Stability: Use Exact Version**
```json
{
  "dependencies": {
    "@nextmavens/sdk": "2.3.0"
  }
}
```
- Only uses exactly 2.3.0
- Manual upgrade required for new versions
- Recommended for production environments

**For Testing Early Access: Use Tilde Range (~)**
```json
{
  "dependencies": {
    "@nextmavens/sdk": "~2.3.0"
  }
}
```
- Accepts 2.3.x versions only
- Example: 2.3.0, 2.3.1, 2.3.2 are acceptable
- 2.4.0 would NOT be installed automatically

### Version Locking Strategy

**Development:**
```bash
# Allow minor and patch updates
pnpm add @nextmavens/sdk@^2.3.0
```

**Production:**
```bash
# Lock to exact version
pnpm add @nextmavens/sdk@2.3.0
```

**Testing New Versions:**
```bash
# Install latest compatible version
pnpm update @nextmavens/sdk

# Or install specific version
pnkm add @nextmavens/sdk@2.4.0
```

## Release Cadence

### Major Releases
- Frequency: As needed, when breaking changes are required
- Notice: 3-6 months preview in beta/stable channels
- Migration: Comprehensive migration guides provided

### Minor Releases
- Frequency: Monthly or quarterly
- Features: New capabilities, enhancements
- Compatibility: Always backward compatible

### Patch Releases
- Frequency: As needed (weekly to monthly)
- Content: Bug fixes, security patches
- Compatibility: Always backward compatible
- Recommendation: Apply promptly for security fixes

## SDK vs API Version Compatibility

SDK versions align with API versions but are versioned independently:

| SDK Version | Compatible API Versions | Notes |
|-------------|------------------------|-------|
| 1.x.x | v1 only | Legacy SDK, use 2.x+ for new projects |
| 2.x.x | v1, v2 | Supports both v1 and v2 APIs |
| 3.x.x | v2 only | Requires API v2+, no v1 support |

**Example:**
```typescript
// SDK 2.x can target either API version
import { NextMavensClient } from '@nextmavens/sdk';

const client = new NextMavensClient({
  apiKey: 'xxx',
  apiVersion: 'v2' // or 'v1'
});
```

## Pre-Release Versions

Pre-release versions are used for testing before stable releases:

```
2.0.0-alpha.1
2.0.0-beta.1
2.0.0-rc.1
```

**Pre-release identifiers:**
- **alpha**: Early development, incomplete features
- **beta**: Feature complete, testing in progress
- **rc** (Release Candidate): Stable, final testing before release

**Usage:**
```json
{
  "dependencies": {
    "@nextmavens/sdk": "2.0.0-rc.1"
  }
}
```

⚠️ **Warning:** Pre-release versions are for testing only. Do not use in production.

## Checking Your SDK Version

### Node.js / TypeScript
```bash
# Check installed version
pnpm list @nextmavens-sdk

# View version in code
console.log(require('@nextmavens/sdk').VERSION);
```

### Python
```bash
# Check installed version
pip show nextmavens-sdk
```

```python
# View version in code
import nextmavens
print(nextmavens.__version__)
```

### Go
```bash
# Check installed version
go list -m github.com/nextmavens/sdk-go
```

## Staying Updated

### Recommended Practices

1. **Subscribe to Changelog** - Monitor SDK release notes
2. **Pin Major Versions** - Use `^` to allow compatible updates
3. **Test Upgrades** - Test minor version upgrades in development
4. **Review Deprecation Notices** - Update code before features are removed
5. **Plan Major Upgrades** - Schedule time for major version migrations

### Update Notifications

To receive notifications about new SDK versions:
- Watch the GitHub repository
- Subscribe to the changelog RSS feed
- Join the developer announcements mailing list

## Related Documentation

- [API Versioning](./api-versioning.md)
- [Deprecation Timeline](./deprecation-timeline.md)
- [Breaking Change Policy](./breaking-change-policy.md)
- [Migration Guides](./migration-guides.md)
- [Version Changelog](./changelog.md)

## Support

For questions about SDK versioning:
- Check the migration guides for version-specific changes
- Review the SDK changelog for version history
- Contact support for assistance with upgrades
