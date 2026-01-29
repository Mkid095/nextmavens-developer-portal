# MCP Token Types Documentation

## Overview

MCP (Model Context Protocol) tokens are API keys designed specifically for AI tools and assistants. They provide controlled access to platform resources with safety guardrails to prevent unintended modifications by AI systems.

## Token Types

### 1. Read-Only MCP Token (`mcp_ro_`)

**Prefix:** `mcp_ro_`

**Description:** The safest token type for AI assistants. Can read data but cannot modify anything.

**Default Scopes:**
- `db:select` - Query database tables
- `storage:read` - Read files from storage
- `realtime:subscribe` - Subscribe to realtime channels

**Use Cases:**
- AI code assistants that need to read your data schema
- Documentation generators
- Analytics tools
- Data exploration by AI

**Example:**
```
mcp_ro_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Safety:** ✅ Safest option - AI cannot modify your data

---

### 2. Write MCP Token (`mcp_rw_`)

**Prefix:** `mcp_rw_`

**Description:** Allows AI tools to both read and write data. Requires explicit opt-in with warning confirmation.

**Default Scopes:**
- All read-only scopes plus:
- `db:insert` - Insert new records
- `db:update` - Update existing records
- `storage:write` - Upload/modify files
- `graphql:execute` - Execute GraphQL mutations

**Use Cases:**
- Trusted AI development tools
- Automated data migration assistants
- Code generation with schema modifications
- AI-powered data synchronization

**Example:**
```
mcp_rw_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Safety:** ⚠️ Use with caution - AI can modify your data

---

### 3. Admin MCP Token (`mcp_admin_`)

**Prefix:** `mcp_admin_`

**Description:** Full administrative access. Bypasses row-level security (RLS) and can manage all resources.

**Default Scopes:**
- All write scopes plus:
- `db:delete` - Delete records
- `auth:manage` - Manage users and authentication
- `secrets:read` - Read sensitive secrets

**Use Cases:**
- AI-powered operations tools
- Automated infrastructure management
- Emergency recovery systems
- Trusted AI ops assistants

**Example:**
```
mcp_admin_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Safety:** 🚨 Highest risk - AI has full control

---

## Database Schema

MCP tokens are stored in the `api_keys` table with the following characteristics:

```sql
CREATE TYPE api_key_type AS ENUM ('public', 'secret', 'service_role', 'mcp');

-- MCP token example
INSERT INTO api_keys (
  project_id,
  key_type,
  key_prefix,
  key_hash,
  name,
  scopes,
  environment
) VALUES (
  'project-uuid',
  'mcp',
  'mcp_ro_',
  'sha256-hash',
  'AI Assistant Token',
  '["db:select", "storage:read", "realtime:subscribe"]'::jsonb,
  'live'
);
```

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `key_type` | `api_key_type` | Set to `'mcp'` for all MCP tokens |
| `key_prefix` | `VARCHAR` | `mcp_ro_`, `mcp_rw_`, or `mcp_admin_` |
| `scopes` | `JSONB` | Array of permission scopes |
| `environment` | `api_key_environment` | `live`, `test`, or `dev` |

---

## Scope Definitions

| Scope | Description | Read-Only | Write | Admin |
|-------|-------------|:--------:|:-----:|:-----:|
| `db:select` | Query database | ✅ | ✅ | ✅ |
| `db:insert` | Insert records | ❌ | ✅ | ✅ |
| `db:update` | Update records | ❌ | ✅ | ✅ |
| `db:delete` | Delete records | ❌ | ❌ | ✅ |
| `storage:read` | Read files | ✅ | ✅ | ✅ |
| `storage:write` | Write files | ❌ | ✅ | ✅ |
| `auth:signin` | Sign in users | ✅ | ✅ | ✅ |
| `auth:signup` | Sign up users | ❌ | ✅ | ✅ |
| `auth:manage` | Manage users | ❌ | ❌ | ✅ |
| `realtime:subscribe` | Subscribe to channels | ✅ | ✅ | ✅ |
| `realtime:publish` | Publish to channels | ❌ | ✅ | ✅ |
| `graphql:execute` | Execute GraphQL | ❌ | ✅ | ✅ |
| `secrets:read` | Read secrets | ❌ | ❌ | ✅ |

---

## Creating MCP Tokens

### Via API

```bash
# Create read-only MCP token
curl -X POST https://api.example.com/api/api-keys \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Assistant",
    "projectId": "project-uuid",
    "key_type": "mcp",
    "mcpAccessLevel": "ro",
    "environment": "live"
  }'

# Create write-enabled MCP token (requires warning confirmation)
curl -X POST https://api.example.com/api/api-keys \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Dev Tool",
    "projectId": "project-uuid",
    "key_type": "mcp",
    "mcpAccessLevel": "rw",
    "confirmWriteAccess": true,
    "environment": "live"
  }'
```

### Via TypeScript

```typescript
import { generateApiKey, hashApiKey, getKeyPrefix } from '@/lib/auth'

// Generate read-only MCP token
const mcpRoToken = generateApiKey('mcp', 'ro')
// Returns: "mcp_ro_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

// Get prefix for reference
const prefix = getKeyPrefix('mcp', 'live', 'ro')
// Returns: "mcp_ro_"

// Hash for storage
const hashed = hashApiKey(mcpRoToken)
```

---

## Security Considerations

### Default Safety

- **Read-only by default:** All MCP tokens default to read-only access
- **Explicit opt-in:** Write access requires explicit confirmation with warning
- **Audit logging:** All MCP actions are logged with `actor_type = 'mcp_token'`

### Best Practices

1. **Start with read-only:** Begin with `mcp_ro_` tokens and only upgrade if needed
2. **Rotate regularly:** Set expiration dates and rotate MCP tokens periodically
3. **Monitor usage:** Check audit logs for unusual AI tool activity
4. **Scope narrowly:** Create separate tokens for different AI tools/tasks
5. **Never expose client-side:** MCP tokens should only be used server-side

### Warning Displays

When creating write-enabled tokens (`mcp_rw_`, `mcp_admin_`), the system displays:

> ⚠️ **Warning: This AI can modify your data**
>
> You are creating a write-enabled MCP token. This grants the AI assistant permission to:
> - Create, modify, and delete database records
> - Upload and modify files
> - Execute GraphQL mutations
>
> Only grant this permission to trusted AI systems.
>
> [ ] I understand the risks and want to proceed

---

## Enforcement

MCP token scopes are enforced at the API gateway level:

1. **Token Validation:** Gateway validates the JWT and extracts `project_id` and `key_type`
2. **Scope Check:** Gateway checks if the token's scopes include the requested operation
3. **Access Denied:** Returns `PERMISSION_DENIED` if scope is insufficient
4. **Audit Logging:** All requests logged with `actor_type = 'mcp_token'`

### Error Response

```json
{
  "error": "PERMISSION_DENIED",
  "message": "This MCP token does not have permission to perform write operations",
  "required_scope": "db:insert",
  "token_type": "mcp_ro",
  "retryable": false
}
```

---

## Comparison Table

| Feature | Public | Secret | Service Role | MCP Read-Only | MCP Write | MCP Admin |
|---------|:------:|:------:|:------------:|:-------------:|:---------:|:---------:|
| Client-side use | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Read data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Write data | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Delete data | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Bypass RLS | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Read secrets | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| AI-optimized | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## Type Definitions

```typescript
// API Key Type
export type ApiKeyType = 'public' | 'secret' | 'service_role' | 'mcp'

// MCP Access Level
export type McpAccessLevel = 'ro' | 'rw' | 'admin'

// Get key prefix
export function getKeyPrefix(
  keyType: ApiKeyType,
  environment: ApiKeyEnvironment = 'live',
  mcpAccessLevel?: McpAccessLevel
): string {
  if (keyType === 'mcp') {
    const level = mcpAccessLevel || 'ro'
    return `mcp_${level}_`
  }
  // ... other types
}
```

---

## Related Documentation

- [API Key Management](./api-keys.md)
- [Scope-Based Access Control](./scopes.md)
- [Audit Logging](./audit-logs.md)
- [Gateway Enforcement](./gateway-enforcement.md)
