# Abuse Controls Feature

## Overview

The Abuse Controls feature provides hard cap management and quota enforcement for projects to prevent abuse and ensure fair resource usage across the platform.

## Hard Caps

The following hard caps are enforced per project:

| Cap Type | Default Value | Description |
|----------|---------------|-------------|
| DB Queries per Day | 10,000 | Maximum database queries allowed per day |
| Realtime Connections | 100 | Maximum simultaneous realtime connections |
| Storage Uploads per Day | 1,000 | Maximum file uploads allowed per day |
| Function Invocations per Day | 5,000 | Maximum serverless function invocations per day |

## Architecture

### Directory Structure

```
src/features/abuse-controls/
├── types/
│   └── index.ts                # TypeScript types and enums
├── lib/
│   ├── quotas.ts               # Quota management functions
│   ├── config.ts               # Configuration constants
│   ├── enforcement.ts          # Quota enforcement and checking
│   ├── data-layer.ts           # Centralized data layer API
│   └── verification.ts         # Integration verification utilities
├── migrations/
│   └── create-quotas-table.ts  # Database migration
├── index.ts                    # Public API exports
└── README.md                   # This file
```

### Database Schema

The `project_quotas` table stores hard cap configurations:

```sql
CREATE TABLE project_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cap_type VARCHAR(50) NOT NULL,
  cap_value INTEGER NOT NULL CHECK (cap_value > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, cap_type)
)
```

## Usage

### Setting Up

First, run the migration to create the quotas table:

```typescript
import { createQuotasTable } from '@/features/abuse-controls'

await createQuotasTable()
```

### Applying Default Quotas to a Project

```typescript
import { applyDefaultQuotas } from '@/features/abuse-controls'

await applyDefaultQuotas(projectId)
```

### Getting Project Quotas

```typescript
import { getProjectQuotas } from '@/features/abuse-controls'

const quotas = await getProjectQuotas(projectId)
```

### Setting Custom Quotas

```typescript
import { setProjectQuota, HardCapType } from '@/features/abuse-controls'

// Set a specific quota
await setProjectQuota(
  projectId,
  HardCapType.DB_QUERIES_PER_DAY,
  50_000
)

// Set multiple quotas
await setProjectQuotas(projectId, [
  { type: HardCapType.DB_QUOTAS_PER_DAY, value: 50_000 },
  { type: HardCapType.REALTIME_CONNECTIONS, value: 200 },
])
```

### Validating Quota Values

```typescript
import { validateCapValue, getCapValidationError } from '@/features/abuse-controls'

const isValid = validateCapValue(HardCapType.DB_QUERIES_PER_DAY, 50_000)
const error = getCapValidationError(HardCapType.DB_QUERIES_PER_DAY, 50)

if (error) {
  console.error(error) // "Database Queries per Day must be at least 100"
}
```

### Checking Quota Violations

```typescript
import { getProjectsExceedingQuota } from '@/features/abuse-controls'

const exceedingProjects = await getProjectsExceedingQuota(
  HardCapType.DB_QUERIES_PER_DAY,
  async (projectId) => {
    // Callback to fetch current usage for a project
    return await getCurrentDbQueryCount(projectId)
  }
)

for (const { projectId, current, limit } of exceedingProjects) {
  console.log(`Project ${projectId} exceeded limit: ${current}/${limit}`)
}
```

## Data Layer API

The `QuotaManager` class provides a centralized interface for quota operations:

```typescript
import { QuotaManager } from '@/features/abuse-controls'

// Initialize quotas for a new project
await QuotaManager.initializeProject(projectId)

// Get quota statistics
const stats = await QuotaManager.getStats(projectId)

// Update a quota
await QuotaManager.updateQuota(
  projectId,
  HardCapType.DB_QUERIES_PER_DAY,
  20000
)

// Check if an operation is allowed
const allowed = await QuotaManager.isAllowed(
  projectId,
  HardCapType.DB_QUERIES_PER_DAY
)

// Record usage
await QuotaManager.record(
  projectId,
  HardCapType.DB_QUERIES_PER_DAY,
  1
)

// Get violations
const violations = await QuotaManager.getViolations(projectId)
```

### Middleware Helper

Use `withQuotaCheck` to automatically enforce quotas in operations:

```typescript
import { withQuotaCheck, QuotaExceededError } from '@/features/abuse-controls'
import { HardCapType } from '@/features/abuse-controls/types'

try {
  const result = await withQuotaCheck(
    projectId,
    HardCapType.DB_QUERIES_PER_DAY,
    async () => {
      // Perform the operation
      return await database.query(...)
    }
  )
} catch (error) {
  if (error instanceof QuotaExceededError) {
    console.error(`Quota exceeded: ${error.capType}`)
  }
}
```

## HTTP API Endpoints

### GET `/api/quotas/:projectId`

Get all quotas for a project.

**Response:**
```json
{
  "project_id": "uuid",
  "configured": true,
  "quotas": [
    {
      "type": "db_queries_per_day",
      "value": 10000,
      "isDefault": true
    }
  ],
  "raw_quotas": [...]
}
```

### PUT `/api/quotas/:projectId`

Update a specific quota for a project.

**Request Body:**
```json
{
  "cap_type": "db_queries_per_day",
  "cap_value": 20000
}
```

**Response:**
```json
{
  "quota": {...},
  "message": "Quota updated successfully"
}
```

### DELETE `/api/quotas/:projectId?cap_type=db_queries_per_day`

Delete a specific quota (resets to default) or reset all quotas to defaults (omit query param).

**Response:**
```json
{
  "message": "Quota db_queries_per_day deleted. Will use default value."
}
```

## Integration with Project Creation

Quotas are automatically applied when new projects are created via the `/api/projects` endpoint:

```typescript
// In src/app/api/projects/route.ts
import { applyDefaultQuotas } from '@/features/abuse-controls/lib/quotas'

// After creating a project
await applyDefaultQuotas(project.id)
```

## Configuration

### Minimum and Maximum Values

Each cap type has enforced minimum and maximum values:

```typescript
import { MIN_HARD_CAPS, MAX_HARD_CAPS } from '@/features/abuse-controls'

MIN_HARD_CAPS[HardCapType.DB_QUERIES_PER_DAY] // 100
MAX_HARD_CAPS[HardCapType.DB_QUERIES_PER_DAY] // 1,000,000
```

### Display Names and Descriptions

UI-friendly names and descriptions are available:

```typescript
import { HARD_CAP_DISPLAY_NAMES, HARD_CAP_DESCRIPTIONS } from '@/features/abuse-controls'

const name = HARD_CAP_DISPLAY_NAMES[HardCapType.DB_QUERIES_PER_DAY]
// "Database Queries per Day"

const description = HARD_CAP_DESCRIPTIONS[HardCapType.DB_QUERIES_PER_DAY]
// "Maximum number of database queries allowed per day..."
```

## API Reference

### Types

- `HardCapType` - Enum of available hard cap types
- `ProjectQuota` - Database record for a project quota
- `HardCapConfig` - Configuration object for setting quotas
- `ProjectUsage` - Current usage statistics
- `QuotaViolation` - Quota violation details

### Functions

- `createQuotasTable()` - Create the quotas table
- `applyDefaultQuotas(projectId)` - Apply default quotas to a project
- `getProjectQuotas(projectId)` - Get all quotas for a project
- `getProjectQuota(projectId, capType)` - Get a specific quota
- `setProjectQuota(projectId, capType, value)` - Set a specific quota
- `setProjectQuotas(projectId, quotas)` - Set multiple quotas
- `hasQuotasConfigured(projectId)` - Check if quotas are configured
- `deleteProjectQuota(projectId, capType)` - Delete a quota
- `resetProjectQuotas(projectId)` - Reset to defaults
- `getProjectsExceedingQuota(capType, usageCallback)` - Find violating projects
- `getProjectQuotaStats(projectId)` - Get quota statistics
- `validateCapValue(capType, value)` - Validate a cap value
- `getCapValidationError(capType, value)` - Get validation error message

## Future Enhancements

This feature is designed to support:

1. **Auto-suspension** - Automatically suspend projects exceeding hard caps
2. **Usage monitoring** - Track and visualize usage patterns
3. **Spike detection** - Detect anomalous usage spikes
4. **Error rate monitoring** - Monitor error rates for abuse patterns
5. **Malicious pattern detection** - Detect SQL injection, brute force, etc.
6. **Notification system** - Alert project owners of quota violations
7. **Suspension UI** - Display suspension details in dashboard
8. **Manual override** - Allow admins to override auto-suspension
9. **Abuse dashboard** - Platform-wide abuse monitoring dashboard

## License

Part of the NextMavens platform.
