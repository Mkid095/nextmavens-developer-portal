# Abuse Controls API Quick Reference

## HTTP Endpoints

### Get Project Quotas
```bash
GET /api/quotas/:projectId
Authorization: Bearer <token>

# Response
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

### Update Quota
```bash
PUT /api/quotas/:projectId
Authorization: Bearer <token>
Content-Type: application/json

# Request
{
  "cap_type": "db_queries_per_day",
  "cap_value": 20000
}

# Response
{
  "quota": {
    "id": "uuid",
    "project_id": "uuid",
    "cap_type": "db_queries_per_day",
    "cap_value": 20000,
    "created_at": "2024-01-28T00:00:00Z",
    "updated_at": "2024-01-28T00:00:00Z"
  },
  "message": "Quota updated successfully"
}
```

### Delete/Reset Quota
```bash
# Delete specific quota (resets to default)
DELETE /api/quotas/:projectId?cap_type=db_queries_per_day

# Reset all quotas to defaults
DELETE /api/quotas/:projectId

# Response
{
  "message": "Quota db_queries_per_day deleted. Will use default value."
}
```

## Programmatic API

### QuotaManager Class

```typescript
import { QuotaManager } from '@/features/abuse-controls'

// Initialize quotas for a new project
await QuotaManager.initializeProject(projectId)

// Get quota configuration
const quotas = await QuotaManager.getQuotas(projectId)

// Get quota statistics
const stats = await QuotaManager.getStats(projectId)

// Update a quota
await QuotaManager.updateQuota(
  projectId,
  HardCapType.DB_QUERIES_PER_DAY,
  20000
)

// Reset to defaults
await QuotaManager.resetToDefaults(projectId)

// Check if operation is allowed
const allowed = await QuotaManager.isAllowed(
  projectId,
  HardCapType.DB_QUERIES_PER_DAY
)

// Check with details
const check = await QuotaManager.checkWithDetails(
  projectId,
  HardCapType.DB_QUERIES_PER_DAY,
  5000
)
// Returns: { allowed: true, currentUsage: 5000, limit: 10000, remaining: 5000 }

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
  // Automatically checks quota, performs operation, records usage
} catch (error) {
  if (error instanceof QuotaExceededError) {
    console.error(`Quota ${error.capType} exceeded for project ${error.projectId}`)
    // Handle quota exceeded
  }
}
```

### Direct Functions

```typescript
import {
  getProjectQuotas,
  getProjectQuota,
  setProjectQuota,
  applyDefaultQuotas,
  resetProjectQuotas,
  hasQuotasConfigured,
  deleteProjectQuota,
  getProjectQuotaStats,
} from '@/features/abuse-controls'

// Get all quotas
const quotas = await getProjectQuotas(projectId)

// Get specific quota
const quota = await getProjectQuota(projectId, HardCapType.DB_QUERIES_PER_DAY)

// Set quota
const result = await setProjectQuota(
  projectId,
  HardCapType.DB_QUERIES_PER_DAY,
  20000
)

// Check if configured
const configured = await hasQuotasConfigured(projectId)

// Get statistics
const stats = await getProjectQuotaStats(projectId)
```

### Enforcement Functions

```typescript
import {
  checkQuota,
  checkMultipleQuotas,
  canPerformOperation,
  recordUsage,
  getQuotaViolations,
} from '@/features/abuse-controls'

// Check single quota
const check = await checkQuota(projectId, HardCapType.DB_QUERIES_PER_DAY, 5000)

// Check multiple quotas
const checks = await checkMultipleQuotas(projectId, [
  { capType: HardCapType.DB_QUERIES_PER_DAY, currentUsage: 5000 },
  { capType: HardCapType.REALTIME_CONNECTIONS, currentUsage: 50 },
])

// Check if allowed
const allowed = await canPerformOperation(
  projectId,
  HardCapType.DB_QUERIES_PER_DAY
)

// Record usage
await recordUsage(projectId, HardCapType.DB_QUERIES_PER_DAY, 1)

// Get violations
const violations = await getQuotaViolations(projectId)
```

## Hard Cap Types

```typescript
enum HardCapType {
  DB_QUERIES_PER_DAY = 'db_queries_per_day',
  REALTIME_CONNECTIONS = 'realtime_connections',
  STORAGE_UPLOADS_PER_DAY = 'storage_uploads_per_day',
  FUNCTION_INVOCATIONS_PER_DAY = 'function_invocations_per_day',
}

// Default values
DEFAULT_HARD_CAPS = {
  DB_QUERIES_PER_DAY: 10_000,
  REALTIME_CONNECTIONS: 100,
  STORAGE_UPLOADS_PER_DAY: 1_000,
  FUNCTION_INVOCATIONS_PER_DAY: 5_000,
}
```

## Validation

```typescript
import {
  validateCapValue,
  getCapValidationError,
  MIN_HARD_CAPS,
  MAX_HARD_CAPS,
} from '@/features/abuse-controls'

// Validate a value
const isValid = validateCapValue(HardCapType.DB_QUERIES_PER_DAY, 20000)

// Get error message
const error = getCapValidationError(HardCapType.DB_QUERIES_PER_DAY, 50)
// Returns: "Database Queries per Day must be at least 100"

// Check ranges
MIN_HARD_CAPS[HardCapType.DB_QUERIES_PER_DAY] // 100
MAX_HARD_CAPS[HardCapType.DB_QUERIES_PER_DAY] // 1_000_000
```

## Configuration

```typescript
import {
  HARD_CAP_DISPLAY_NAMES,
  HARD_CAP_DESCRIPTIONS,
} from '@/features/abuse-controls'

// Display names for UI
const name = HARD_CAP_DISPLAY_NAMES[HardCapType.DB_QUERIES_PER_DAY]
// "Database Queries per Day"

// Descriptions for UI
const description = HARD_CAP_DESCRIPTIONS[HardCapType.DB_QUERIES_PER_DAY]
// "Maximum number of database queries allowed per day..."
```

## Error Handling

```typescript
import { QuotaExceededError } from '@/features/abuse-controls'

try {
  await performOperation()
} catch (error) {
  if (error instanceof QuotaExceededError) {
    console.error(error.capType)      // Which cap was exceeded
    console.error(error.projectId)    // Which project
    console.error(error.message)      // Error message
  }
}
```
