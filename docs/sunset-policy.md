# Sunset Policy

This document defines the sunset policy for the NextMavens platform, establishing clear support timelines and communication processes when API and SDK versions reach end-of-life.

## Overview

When a new major version is released, the previous version enters a support period before being sunset (retired). This policy provides developers with predictable timelines and advance notice to plan migrations.

## Support Policy: 1 Year After Next Release

### Standard Support Period

After a new major version is released, the previous version is supported for **12 months** from the release date of the new version.

**Timeline:**
```
Month 0:    New version released, previous version enters support period
Month 1-11: Previous version fully supported (bug fixes, security patches, critical issues)
Month 12:   Previous version sunset (support discontinued)
```

**Example:**
```
January 1, 2025:   API v2 released, v1 enters 12-month support period
January 1, 2026:   API v1 sunset (no longer supported)
```

### What "Supported" Means

During the 12-month support period, the previous version receives:

1. **Bug Fixes**
   - Functional defects and edge cases
   - Performance issues affecting production use
   - Data inconsistency problems
   - Integration issues with documented functionality

2. **Security Patches**
   - Vulnerability remediation (CVE-level issues)
   - Security hardening for known attack vectors
   - Compliance-related security updates
   - Authentication/authorization fixes

3. **Critical Issue Resolution**
   - Production incidents affecting multiple customers
   - Service availability problems
   - Data loss or corruption bugs
   - Severe performance degradation

4. **Documentation Maintenance**
   - Corrections to inaccurate documentation
   - Clarification of ambiguous behaviors
   - Examples and usage guidance

## Sunset Phase: What Happens After Support Ends

### At Sunset Date

When a version reaches its sunset date:

1. **API Endpoints Return 410 Gone**
   ```http
   HTTP/1.1 410 Gone
   Content-Type: application/json

   {
     "error": {
       "code": "VERSION_SUNSET",
       "message": "API v1 has been sunset and is no longer available. Please use API v2.",
       "sunset_date": "2026-01-01T00:00:00Z",
       "migration_guide": "https://docs.nextmavens.com/migration/v1-to-v2"
     }
   }
   ```

2. **SDK Methods Throw Exceptions**
   ```typescript
   // SDK v1.x after sunset
   import { NextMavensClient } from '@nextmavens/sdk@1';

   const client = new NextMavensClient({ apiKey: 'xxx' });
   // Error: This SDK version has been sunset. Please upgrade to v2.0.0 or later.
   // See: https://docs.nextmavens.com/sdk/migration/1-to-2
   ```

3. **Documentation Moves to Archive**
   - Docs removed from main navigation
   - Moved to version-specific archive
   - Prominent "deprecated" notices added

4. **Support Discontinued**
   - No new bug fixes or patches
   - No security updates (see emergency exception below)
   - Support tickets redirected to upgrade guidance

### Emergency Security Patches (Exception)

**After sunset, emergency security patches may be released for critical vulnerabilities:**

1. **Criteria for Emergency Patches**
   - CVSS score 9.0+ (critical severity)
   - Exploitable in the wild
   - Affects production systems
   - No viable workaround available

2. **Emergency Patch Process**
   - Patch released within 72 hours of disclosure
   - Minimum viable fix only (no other changes)
   - Accompanied by security advisory
   - Strong recommendation to upgrade immediately

3. **Limited Scope**
   - Only the specific vulnerability is patched
   - No other bugs or issues addressed
   - No compatibility improvements
   - No new features or functionality

4. **Post-Patch Expectations**
   - Users strongly encouraged to migrate within 30 days
   - Emergency patch may be the final release for that version
   - No further patches guaranteed even for new vulnerabilities

**Emergency Patch Example:**
```json
{
  "version": "1.9.8-emergency",
  "release_date": "2026-03-15",
  "description": "Emergency security patch for CVE-2026-1234",
  "severity": "critical",
  "cve": "CVE-2026-1234",
  "cvss_score": 9.8,
  "advisory": "https://docs.nextmavens.com/security/advisories/CVE-2026-1234",
  "upgrade_required": true,
  "supported_until": "2026-04-15"
}
```

### What's NOT Provided After Sunset

After the sunset date, the following are **NOT provided**:

- New features or functionality
- Non-critical bug fixes
- Performance improvements
- Documentation updates
- Technical support beyond migration guidance
- Compatibility fixes for new dependencies
- Integration assistance with new services

## Communication Timeline

### 12 Months Before Sunset (At New Version Release)

**When: Immediately when new major version is released**

**Actions:**
1. **Official Announcement**
   - Blog post: "API v2 Released - v1 Sunset Scheduled for January 2026"
   - Email to all affected developers
   - Banner in developer dashboard
   - Changelog entry with sunset date

2. **Documentation Updates**
   - Sunset date added to version discovery endpoint
   - Deprecation headers added to all responses
   - Sunset notice added to documentation pages
   - Migration guide published

3. **Header Indicators**
   ```http
   HTTP/1.1 200 OK
   API-Version: v1
   Deprecated: true
   Sunset: Sat, 01 Jan 2026 00:00:00 GMT
   Link: <https://docs.nextmavens.com/migration/v1-to-v2>; rel="migration-guide"
   ```

### 6 Months Before Sunset

**When: 6 months remaining until sunset**

**Actions:**
1. **Reminder Email Campaign**
   - Email: "6 Months Until API v1 Sunset - Start Planning Your Migration"
   - Targeted to users still on v1 (detected via API usage)
   - Includes migration checklist and timeline

2. **Dashboard Notifications**
   - Persistent banner in dashboard for v1 users
   - Countdown timer showing days until sunset
   - Migration progress tracker

3. **Webinar and Office Hours**
   - Live Q&A session about migration
   - Walkthrough of migration process
   - Office hours for 1:1 migration help

### 3 Months Before Sunset

**When: 3 months remaining until sunset**

**Actions:**
1. **Final Warning Communications**
   - Email: "3 Months Until API v1 Sunset - Migration Required"
   - Push notifications in dashboard
   - In-app banners (cannot be dismissed)

2. **Migration Support Escalation**
   - Dedicated migration support channel
   - Free code review for migration PRs
   - Extended office hours schedule
   - Migration assistance from engineering team

3. **Documentation Updates**
   - Migration guide updated with common issues
   - Troubleshooting section expanded
   - Example migration PRs from similar projects

### 1 Month Before Sunset

**When: 1 month remaining until sunset**

**Actions:**
1. **Urgent Communications**
   - Email: "URGENT: API v1 Sunset in 30 Days"
   - SMS/app notifications for account owners
   - Account manager outreach for enterprise customers

2. **Final Support Push**
   - Daily migration office hours
   - Expedited review for migration-related tickets
   - Engineering team standby for blockers

3. **Dashboard Countdown**
   - Prominent countdown on dashboard home
   - "Action Required" badge on project settings
   - Migration checklist with completion tracking

### At Sunset (0 Months)

**When: Sunset date arrives**

**Actions:**
1. **Version Deprecated**
   - API endpoints return 410 Gone
   - SDK methods throw sunset exceptions
   - Documentation moved to archive

2. **Final Communication**
   - Email: "API v1 Has Been Sunset"
   - FAQ on "What do I do if I missed the deadline?"
   - Emergency contact for critical production issues

3. **Grace Period Extension (Rare)**
   - Only for enterprise customers with active migration contracts
   - Requires explicit approval from CTO
   - Maximum 30-day extension with premium support fee

## Checking Sunset Status

### Via Version Discovery API

```bash
curl https://api.nextmavens.cloud/versions
```

**Response:**
```json
{
  "versions": [
    {
      "version": "v2",
      "status": "current",
      "stable": true,
      "deprecated": false,
      "sunset_date": null,
      "supported_until": null
    },
    {
      "version": "v1",
      "status": "sunset",
      "stable": false,
      "deprecated": true,
      "sunset_date": "2026-01-01T00:00:00Z",
      "supported_until": "2026-01-01T00:00:00Z",
      "migration_guide": "https://docs.nextmavens.com/migration/v1-to-v2"
    }
  ]
}
```

### Via Dashboard

1. Navigate to **Project Settings** → **API Status**
2. View current API version and sunset status
3. See countdown timer for upcoming sunsets
4. Access migration resources

### Via Headers

```bash
curl -I https://api.nextmavens.cloud/v1/organizations
```

**Response Headers:**
```http
HTTP/1.1 410 Gone
API-Version: v1
Deprecated: true
Sunset: Sat, 01 Jan 2026 00:00:00 GMT
Link: <https://api.nextmavens.cloud/v2/organizations>; rel="successor-version"
```

## Sunset Policy by Version Type

### API Versions

- **Support Duration:** 12 months after next major version release
- **Notice Period:** 12 months (announced at next version release)
- **Post-Sunset:** Emergency security patches only (CVSS 9.0+)
- **Migration:** Full migration guide and support provided

### SDK Versions

- **Support Duration:** 12 months after next major version release
- **Notice Period:** 12 months (announced at next version release)
- **Post-Sunset:** Emergency security patches only (CVSS 9.0+)
- **Migration:** Codemods and migration tools provided

### Beta/Preview Versions

- **Support Duration:** No guaranteed support period
- **Notice Period:** Best effort, may be sunset with 30 days notice
- **Post-Sunset:** No patches or updates
- **Migration:** May require manual migration to stable version

## Extension Requests

### Request Process

In exceptional circumstances, sunset extensions may be requested:

1. **Submit Request**
   - Contact support with subject: "Sunset Extension Request"
   - Include: project details, migration blockers, requested extension duration

2. **Review Process**
   - Engineering team reviews request
   - Assessment of migration blockers
   - Decision within 5 business days

3. **Extension Terms**
   - Maximum 30-day extension
   - Requires migration plan commitment
   - May incur premium support fees
   - Not guaranteed approval

### Extension Criteria

Extensions are considered for:

- Enterprise customers with active support contracts
- Documented technical blockers preventing migration
- Critical production systems with no migration window
- Dependents on third-party services requiring the old version

Extensions are **NOT** granted for:

- Lack of prioritization
- Resource constraints
- Inadequate planning
- Non-critical systems

## Best Practices for Developers

### Plan Migrations Early

1. **Assess Impact Immediately**
   - When new version announced, inventory usage of deprecated version
   - Estimate migration effort
   - Identify dependencies

2. **Create Migration Timeline**
   - Start migration within 3 months of announcement
   - Allocate dedicated development time
   - Schedule migration well before sunset date

3. **Test Thoroughly**
   - Test against new version in staging
   - Run integration tests
   - Validate all functionality
   - Performance test new version

### Stay Informed

1. **Monitor Communications**
   - Subscribe to developer mailing list
   - Follow @NextMavensDev on Twitter
   - Watch GitHub repository releases
   - Check dashboard regularly

2. **Check Sunset Status**
   - Query version discovery endpoint quarterly
   - Review dashboard notifications
   - Monitor deprecation headers in API responses
   - Watch for SDK console warnings

3. **Participate in Beta Programs**
   - Test new versions during beta
   - Provide feedback on breaking changes
   - Influence sunset timeline through feedback

## Exceptions and Special Cases

### Security Emergencies

For critical security vulnerabilities (CVSS 9.0+):

- Emergency patches may be released for sunset versions
- 72-hour turnaround for critical issues
- Users must upgrade within 30 days of patch
- No guarantee of patches for future vulnerabilities

### Legal or Compliance Requirements

For legal or compliance mandates:

- Sunset timeline may be accelerated
- Minimum notice as required by law
- Migration assistance provided
- Alternative solutions documented

### Acquisition or Shutdown

For product acquisition or shutdown:

- 90-day minimum notice for sunset
- Data export options provided
- Migration guidance to alternatives
- Extended support may be available

## Related Documentation

- [API Versioning](./api-versioning.md)
- [SDK Semantic Versioning](./sdk-versioning.md)
- [Deprecation Timeline](./deprecation-timeline.md)
- [Breaking Change Policy](./breaking-change-policy.md)
- [Migration Guides](./migration-guides.md)

## Support

For questions about sunset policy:

- Review the migration guide for the sunset version
- Check the dashboard for sunset countdowns
- Contact support for sunset extension requests
- Join the developer community for migration help

## Summary Table

| Version Type | Support Period | Notice Period | Post-Sunset Support |
|--------------|----------------|---------------|---------------------|
| **API Major Version** | 12 months | 12 months | Emergency security patches only |
| **SDK Major Version** | 12 months | 12 months | Emergency security patches only |
| **Beta/Preview** | None | Best effort (30 days) | No support |
| **Security Emergency** | N/A | 72 hours | Patch within 72 hours |
| **Legal Requirement** | N/A | As required | Accelerated timeline |

## Timeline Visualization

```
API v1 Lifecycle Example:

│←─────────────────────────────────────────────────────────────→│
Time (Months)

0────────────────────────────────────────────────────────────────→12

├────────────────────────────────────────────────────────────────┤
│ API v1 Current (Fully Supported)                              │
├────────────────────────────────────────────────────────────────┤
         ↓ API v2 Released (Month 0)
         ↓ v1 Enters Support Period
         ↓ Sunset Announced: Month 12

├────────────────────────────────────────────────────────────────┤
│ API v1 Supported (12-Month Support Period)                    │
│ - Bug fixes                                                   │
│ - Security patches                                            │
│ - Critical issues                                             │
│ - Documentation maintenance                                   │
├────────────────────────────────────────────────────────────────┤
         ↓ 6-Month Reminder (Month 6)
         ↓ 3-Month Final Warning (Month 9)
         ↓ 1-Month Urgent Notice (Month 11)

├────────────────────────────────────────────────────────────────┤
│ API v1 Sunset (Month 12+)                                     │
│ - 410 Gone responses                                         │
│ - No support (except emergency security patches)              │
│ - Documentation archived                                      │
├────────────────────────────────────────────────────────────────┤
```
