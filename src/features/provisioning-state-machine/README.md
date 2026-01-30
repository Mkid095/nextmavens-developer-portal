# Provisioning State Machine

## Overview

This feature implements a step-aware provisioning system that tracks each provisioning step separately. This enables safe retry from failure and better UX during project provisioning.

## Database Schema

### `provisioning_steps` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | Reference to the project |
| `step_name` | VARCHAR(100) | Name of the provisioning step |
| `status` | VARCHAR(20) | Current status (pending/running/success/failed/skipped) |
| `started_at` | TIMESTAMPTZ | When the step started |
| `completed_at` | TIMESTAMPTZ | When the step completed |
| `error_message` | TEXT | Human-readable error message |
| `error_details` | JSONB | Detailed error information |
| `retry_count` | INTEGER | Number of retry attempts |
| `created_at` | TIMESTAMPTZ | When the step was created |

## Provisioning Steps

1. `create_tenant_database` - Create the tenant database
2. `create_tenant_schema` - Create the tenant schema
3. `register_auth_service` - Register with auth service
4. `register_realtime_service` - Register with realtime service
5. `register_storage_service` - Register with storage service
6. `generate_api_keys` - Generate API keys
7. `verify_services` - Verify all services are ready

## Usage

### Running the Migration

```typescript
import { createProvisioningStepsTable } from '@/features/provisioning-state-machine/migrations'

await createProvisioningStepsTable()
```

### Initializing Steps for a New Project

```typescript
import { initializeProvisioningSteps } from '@/features/provisioning-state-machine/migrations'

await initializeProvisioningSteps(projectId)
```

### Getting Provisioning Steps

```typescript
import { getProvisioningSteps } from '@/features/provisioning-state-machine/migrations'

const { data: steps } = await getProvisioningSteps(projectId)
```

### Updating a Step Status

```typescript
import { updateProvisioningStep } from '@/features/provisioning-state-machine/migrations'

await updateProvisioningStep(
  projectId,
  'create_tenant_database',
  'running'
)

await updateProvisioningStep(
  projectId,
  'create_tenant_database',
  'success'
)

await updateProvisioningStep(
  projectId,
  'create_tenant_schema',
  'failed',
  {
    errorMessage: 'Schema creation failed',
    errorDetails: { errorCode: 'SCHEMA_ERROR', details: '...' }
  }
)
```

## Status Transitions

```
PENDING → RUNNING → SUCCESS
                ↘ FAILED → PENDING (retry)
```

## Related Files

- Migration: `src/features/provisioning-state-machine/migrations/create-provisioning-steps-table.ts`
- PRD: `docs/prd-provisioning-state-machine.json`
