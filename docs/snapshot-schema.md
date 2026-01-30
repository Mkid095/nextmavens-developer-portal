# Control Plane Snapshot Schema

## Overview

The Control Plane Snapshot API provides an authoritative, cached view of control plane state for data plane services. This document defines the complete schema for snapshot responses.

**Endpoint:** `GET /api/internal/snapshot?project_id=xxx`

**Version:** 1.0.0

## Response Format

### Top-Level Structure

```typescript
{
  snapshot: ControlPlaneSnapshot,
  metadata: SnapshotMetadata
}
```

## ControlPlaneSnapshot Schema

### Version

```typescript
version: string  // Format: "v1", "v2", "v3", etc.
```

The version string increments whenever the snapshot's underlying data changes. Data plane services use this to detect stale cached data.

**Version Increment Logic:**
- Version increments when `invalidateSnapshot(projectId)` is called
- Automatic invalidation triggers:
  - Project status changes (suspend/unsuspend/override/unlock)
  - Quota changes (set/delete/reset)
  - Service enablement changes
- Version format: `v{n}` where n is a monotonically increasing integer

### Project

```typescript
project: {
  id: string,           // UUID
  status: ProjectStatus,
  environment: Environment,
  tenant_id: string,    // UUID
  created_at: string,   // ISO 8601 datetime
  updated_at: string    // ISO 8601 datetime
}
```

#### ProjectStatus Enum

Valid project statuses (lowercase to match database schema):

| Value | Description |
|-------|-------------|
| `created` | Project initialized but not active |
| `active` | Project is fully operational |
| `suspended` | Project temporarily suspended (fail-closed) |
| `archived` | Project archived (read-only) |
| `deleted` | Project scheduled for deletion |

#### Environment Enum

| Value | Description |
|-------|-------------|
| `development` | Development environment |
| `staging` | Staging/pre-production environment |
| `production` | Production environment |

### Services

```typescript
services: {
  auth: ServiceConfig,
  graphql: ServiceConfig,
  realtime: ServiceConfig,
  storage: ServiceConfig,
  database: ServiceConfig,
  functions: ServiceConfig
}
```

#### ServiceConfig

```typescript
{
  enabled: boolean,
  config?: Record<string, unknown>  // Optional service-specific configuration
}
```

**Service Enablement Rules:**
- When `enabled: false`, data plane services MUST deny all requests for that service
- When `enabled: true`, the service is operational
- The `config` object contains service-specific settings (future use)

### Limits (Rate Limits)

```typescript
limits: {
  requests_per_minute: number,  // Non-negative integer
  requests_per_hour: number,    // Non-negative integer
  requests_per_day: number      // Non-negative integer
}
```

**Rate Limiting Behavior:**
- All three limits apply simultaneously
- Limits are enforced per-project
- Sliding window algorithm recommended for enforcement
- Exceeding any limit results in HTTP 429 (Too Many Requests)

### Quotas (Hard Quotas)

```typescript
quotas: {
  db_queries_per_day: number,           // Non-negative integer
  realtime_connections: number,         // Non-negative integer
  storage_uploads_per_day: number,      // Non-negative integer
  function_invocations_per_day: number  // Non-negative integer
}
```

**Quota Enforcement:**
- Quotas are hard limits that cannot be exceeded
- Quotas reset daily (UTC midnight)
- Exceeding a quota results in service denial (fail-closed)

## SnapshotMetadata Schema

```typescript
metadata: {
  generatedAt: string,  // ISO 8601 datetime
  ttl: number,          // Positive integer (seconds)
  cacheHit: boolean     // True if response was from cache
}
```

## Example Response

```json
{
  "snapshot": {
    "version": "v1",
    "project": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "active",
      "environment": "production",
      "tenant_id": "550e8400-e29b-41d4-a716-446655440001",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-20T15:45:30.000Z"
    },
    "services": {
      "auth": { "enabled": true },
      "graphql": { "enabled": true },
      "realtime": { "enabled": true },
      "storage": { "enabled": true },
      "database": { "enabled": true },
      "functions": { "enabled": true }
    },
    "limits": {
      "requests_per_minute": 6,
      "requests_per_hour": 416,
      "requests_per_day": 10000
    },
    "quotas": {
      "db_queries_per_day": 10000,
      "realtime_connections": 100,
      "storage_uploads_per_day": 1000,
      "function_invocations_per_day": 5000
    }
  },
  "metadata": {
    "generatedAt": "2024-01-20T16:00:00.000Z",
    "ttl": 45,
    "cacheHit": false
  }
}
```

## Error Responses

### 404 Not Found

Project not found:

```json
{
  "error": "Project not found",
  "code": "NOT_FOUND",
  "details": {
    "resource": "project",
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 503 Service Unavailable

Control plane unavailable (fail-closed):

```json
{
  "error": "Control plane temporarily unavailable",
  "code": "INTERNAL_ERROR",
  "details": {
    "retry_after": 30
  }
}
```

**Headers:**
```
Retry-After: 30
X-Cache-Status: ERROR
```

## Client Implementation Guidelines

### Caching Strategy

1. **Local Cache:** Cache snapshots locally with 30s TTL
2. **Version Check:** Compare version on cache refresh to detect changes
3. **Fail-Closed:** Deny all requests when snapshot is unavailable

### Validation

Clients SHOULD validate received snapshots against the schema:

```typescript
import { validateSnapshot } from '@/lib/snapshot/schema'

const snapshot = await fetchSnapshot(projectId)
const validated = validateSnapshot(snapshot)
```

### Version-Based Invalidation

```typescript
let cachedSnapshot: ControlPlaneSnapshot | null = null
let cachedVersion: string | null = null

function shouldRefreshSnapshot(newSnapshot: ControlPlaneSnapshot): boolean {
  if (!cachedSnapshot) return true
  return newSnapshot.version !== cachedVersion
}
```

## Schema Versioning

This schema is version 1.0.0. Future versions will:

1. Maintain backward compatibility when possible
2. Use feature flags for breaking changes
3. Communicate changes via the version field in snapshots

## Related Documentation

- [Control Plane Snapshot PRD](./prd-control-plane-snapshot.json)
- [Fail-Closed Behavior](./prd-break-glass.json)
- [Rate Limiting](./prd-quotas-limits.json)
- [Quotas](./prd-abuse-controls.json)
