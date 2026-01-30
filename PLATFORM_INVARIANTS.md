# NextMavens Platform Invariants

**Last Updated:** 2025-01-30
**Version:** 1.0.0
**Status:** Living Document

## Overview

This document defines the core architectural invariants of the NextMavens platform. These are immutable rules that MUST NOT be violated. They are designed to prevent architectural drift, ensure security, maintain observability, and provide a reliable foundation for all platform development.

**Target Audience:** Platform engineers, contributors, and system architects. This is NOT user documentation.

## What is an Invariant?

An invariant is a property that must always hold true regardless of system state. These are not "best practices" or "guidelines" - they are enforceable architectural constraints. Violating an invariant is a critical bug that must be fixed immediately.

---

## Core Principles

### 1. Control Plane Source of Truth

**Invariant:** The control plane database is the single authoritative source of truth for all governance state.

**Explanation:** All project configuration, quotas, service enablement, API keys, and user access control data live in the control plane database. This is the only place where this data can be mutated.

**Rules:**
- Data plane services MUST NOT mutate governance state
- Data plane services MUST read governance state via the Snapshot API only
- Direct database access from data plane to control plane is prohibited
- All configuration changes flow: Control Plane API → Control Plane DB → Snapshot API → Data Plane

**Correct Pattern:**
```
Data Plane Service → Snapshot API (read-only) → Validate Request
```

**Incorrect Pattern:**
```
Data Plane Service → Control Plane DB (direct connection) → Mutate State
```

**Rationale:** Separation of concerns. The control plane governs, the data plane serves. This isolation prevents race conditions, ensures auditability, and allows the control plane to enforce policies consistently.

---

### 2. Idempotent Destructive Actions

**Invariant:** All destructive operations MUST be idempotent.

**Explanation:** Calling a destructive operation multiple times must produce the same result as calling it once. No partial failure states are permitted.

**Rules:**
- DELETE /projects/:id called twice = same result (already deleted)
- POST /keys/:id/rotate called twice = same result (same key version)
- DELETE /webhooks/:id called twice = same result (webhook deleted)
- Operations must check state before acting
- No "half-deleted" or "half-rotated" states

**Correct Pattern:**
```typescript
async function deleteProject(projectId: string) {
  const existing = await db.projects.findUnique({ projectId })
  if (!existing || existing.status === 'DELETED') {
    return { success: true, message: 'Project already deleted' }
  }
  // Perform deletion
  await db.projects.update({ projectId, status: 'DELETED' })
  return { success: true }
}
```

**Incorrect Pattern:**
```typescript
async function deleteProject(projectId: string) {
  // No check - will fail if already deleted
  await db.projects.delete({ projectId })
}
```

**Rationale:** Distributed systems retry automatically. If a deletion fails after the first half completes, a retry MUST succeed, not fail. Idempotency prevents "zombie" states where resources are partially deleted.

---

### 3. Request Attribution

**Invariant:** Every request MUST be attributable to a specific project and actor.

**Explanation:** No anonymous requests allowed (except authentication endpoints). All activity must be traceable to who did what, when, from where.

**Rules:**
- API requests must include `project_id` in JWT claims
- Log entries must include `project_id` and `actor_id`
- Audit entries must include `actor_id`, `project_id`, and `request_id`
- Background jobs must include `project_id` in context
- Internal health checks are the only exception

**Correct Pattern:**
```typescript
// JWT contains: { project_id: "proj_123", user_id: "user_456" }
app.use((req, res, next) => {
  req.context = {
    projectId: req.jwt.project_id,
    actorId: req.jwt.user_id,
    requestId: req.headers['x-request-id']
  }
  next()
})
```

**Incorrect Pattern:**
```typescript
// No attribution - who made this request?
app.post('/api/something', async (req, res) => {
  await doSomething(req.body)
})
```

**Rationale:** Observability is useless without attribution. When something breaks or abuse occurs, we must be able to answer "who did this?" and "which project was affected?" immediately.

---

### 4. No Direct Control DB Access

**Invariant:** Data plane services MUST NOT connect directly to the control plane database.

**Explanation:** All data plane reads of governance state must go through the Control Plane Snapshot API. No exceptions.

**Rules:**
- Data plane services call `/api/snapshot` (read-only)
- Data plane services never open connections to control database
- Data plane services cache snapshots with 30s TTL
- If snapshot API is unavailable, data plane fails closed (denies requests)

**Correct Pattern:**
```typescript
// Data Plane Service
class ProjectConfig {
  private snapshot: Snapshot | null = null
  private lastFetch = 0
  private readonly TTL = 30000 // 30s

  async getConfig(projectId: string) {
    if (Date.now() - this.lastFetch > this.TTL) {
      this.snapshot = await fetch(`${CONTROL_PLANE}/api/snapshot`).then(r => r.json())
      this.lastFetch = Date.now()
    }
    return this.snapshot.projects[projectId]
  }
}
```

**Incorrect Pattern:**
```typescript
// VIOLATION: Direct database connection from data plane
const db = new Database('postgres://control-plane-db...')
const config = await db.projects.findUnique({ projectId })
```

**Rationale:** Architectural boundaries. The control plane owns governance logic. Allowing direct access creates tight coupling, bypasses audit logging, and allows data plane services to violate invariants accidentally.

---

### 5. Isolation Enforcement

**Invariant:** Multi-tenant isolation MUST be enforced, never implied.

**Explanation:** Cross-project access must be technically impossible, not just policy-prohibited. Return 403 (Forbidden), never 404 (Not Found), for cross-project access attempts.

**Rules:**
- All database queries scoped to `tenant_{project_id}` schema
- All realtime channels prefixed with `{project_id}:`
- All storage paths prefixed with `{project_id}/`
- Cross-project access returns 403, logs as security violation
- Never use 404 for cross-project access (404 hides the violation)

**Correct Pattern:**
```typescript
// Database query with enforced isolation
async function queryUserData(projectId: string, userId: string) {
  const schema = `tenant_${projectId}`
  return await db.$queryRaw`
    SELECT * FROM ${db.raw(schema)}.users
    WHERE id = ${userId}
  `
}

// Realtime channel with project prefix
const channel = `${projectId}:user:${userId}`

// Storage path with project prefix
const filePath = `${projectId}/uploads/${filename}`
```

**Incorrect Pattern:**
```typescript
// No isolation - user can query any project's data
async function queryUserData(projectId: string, userId: string) {
  return await db.users.findUnique({ userId })
}

// Cross-project access attempt should return 403, not 404
if (requestedProjectId !== currentProjectId) {
  return res.status(404).json({ error: 'Not found' }) // WRONG
}
```

**Rationale:** Security through isolation, not policy. If isolation fails due to a bug, returning 404 hides the security violation. Returning 403 alerts us to the breach. Make cross-project access technically impossible, not just against the rules.

---

### 6. Universal Observability

**Invariant:** Every request MUST have a correlation ID that propagates across all services.

**Explanation:** Distributed tracing must be possible for every request. No orphaned requests allowed.

**Rules:**
- Every incoming request has `x-request-id` header (generate if missing)
- Every log entry includes `request_id`
- Every audit entry includes `request_id`
- Every downstream call includes `x-request-id` header
- Every background job inherits `request_id` from triggering request

**Correct Pattern:**
```typescript
// Middleware: Generate or use existing correlation ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID()
  res.setHeader('x-request-id', req.id)
  logger.setContext('request_id', req.id)
  next()
})

// Propagate to downstream services
const response = await fetch('https://other-service/api', {
  headers: {
    'x-request-id': req.id
  }
})

// Log with correlation ID
logger.info('Processing request', { request_id: req.id })
```

**Incorrect Pattern:**
```typescript
// No correlation ID - impossible to trace across services
app.post('/api/something', async (req, res) => {
  await doSomething()
  logger.info('Done') // Which request?
})
```

**Rationale:** Debugging distributed systems without correlation IDs is impossible. When a user reports an issue, we need to trace their request across auth → gateway → data plane → database → external services. Without universal correlation IDs, we're flying blind.

---

### 7. Fail Closed Security

**Invariant:** When in doubt, deny the request. Security ALWAYS takes priority over availability.

**Explanation:** If any security-relevant service is unreachable or state is unknown, the system MUST deny requests rather than allow them.

**Rules:**
- Control plane unreachable = deny all data plane requests
- Snapshot API unavailable = deny all requests (don't use stale cache)
- Service health unknown = deny requests to that service
- JWT validation failed = deny (never allow "anonymous" requests)
- Rate limiter down = deny (don't fall back to open)

**Correct Pattern:**
```typescript
// Snapshot fetch with fail-closed
async function getSnapshot(): Promise<Snapshot> {
  try {
    const snapshot = await fetch(`${CONTROL_PLANE}/api/snapshot`)
    if (!snapshot.ok) throw new Error('Snapshot unavailable')
    return await snapshot.json()
  } catch (error) {
    logger.error('Snapshot unavailable, failing closed', { error })
    throw new SecurityError('Cannot validate request: control plane unreachable')
  }
}

// Gateway middleware: Deny if project status unknown
if (!snapshot.projects[projectId]) {
  throw new SecurityError('Project not found in snapshot')
}
```

**Incorrect Pattern:**
```typescript
// DANGEROUS: Uses stale cache when snapshot unavailable
let snapshotCache = null
async function getSnapshot() {
  try {
    snapshotCache = await fetch(`${CONTROL_PLANE}/api/snapshot`).then(r => r.json())
  } catch (error) {
    logger.warn('Snapshot unavailable, using stale cache') // SECURITY RISK
    return snapshotCache // May allow suspended projects!
  }
}
```

**Rationale:** The platform protects user data and systems. An outage is annoying; a security breach is catastrophic. It's better to incorrectly deny legitimate requests than to incorrectly allow illegitimate ones.

---

### 8. Secrets Never Logged

**Invariant:** Secret values MUST NEVER appear in logs, error messages, or audit logs.

**Explanation:** Only secret identifiers and metadata may be logged. Never log the actual secret value.

**Rules:**
- API key values never in logs (only `key_id` and `key_type`)
- Database passwords never in logs (only connection hash)
- JWT tokens never in logs (only `jwt_id` or `sub` claim)
- Secret access logged with `secret_id`, not `secret_value`
- Error messages must not contain secrets (redact if needed)

**Correct Pattern:**
```typescript
// Log key creation (safe)
logger.info('API key created', {
  key_id: key.id,
  key_type: key.type,
  project_id: key.projectId,
  scopes: key.scopes
})

// Log secret access (safe)
await audit.log({
  action: 'secret.accessed',
  actor_id: userId,
  target_type: 'secret',
  target_id: secret.id,
  metadata: { secret_name: secret.name } // No secret value!
})

// Error with redaction
throw new Error(`Failed to connect: ${errorMessage.replace(/password=[^ ]+/g, 'password=***')}`)
```

**Incorrect Pattern:**
```typescript
// SECURITY BREACH: Logs secret value
logger.info('API key created', {
  key_id: key.id,
  key_value: key.rawValue // NEVER LOG THIS
})

// SECURITY BREACH: Logs token
logger.debug('JWT decoded', { token: jwtString })
```

**Rationale:** Logs are accessible to many systems and people. Secrets in logs are a massive security vulnerability. Even if logs are "protected," they're frequently exported to monitoring tools, SIEMs, and support systems. Never trust that logs will stay secure.

---

### 9. MCP Read-Only Default

**Invariant:** MCP (Model Context Protocol) tokens MUST be read-only by default. Write access requires explicit opt-in.

**Explanation:** AI tools connected via MCP have powerful data access capabilities. By default, these connections must be read-only to prevent accidental data modification.

**Rules:**
- MCP tokens default to read-only scopes
- Write access requires explicit user opt-in
- Write access must display warning: "This AI tool can modify your data"
- All MCP actions heavily audited (actor_id, action, target)
- MCP scope documentation clearly describes what write access allows
- revoke MCP tokens immediately when project is archived

**Correct Pattern:**
```typescript
// Create MCP token (read-only by default)
const mcpToken = await createMCPToken({
  projectId,
  scopes: ['data:read', 'schema:read'], // Default: read-only
  metadata: { purpose: 'AI assistant' }
})

// User opts into write access
const writeToken = await createMCPToken({
  projectId,
  scopes: ['data:read', 'data:write', 'schema:read'], // Explicit write
  metadata: {
    purpose: 'AI assistant with write access',
    write_consent: true,
    consent_timestamp: Date.now()
  }
})
```

**Incorrect Pattern:**
```typescript
// DANGEROUS: Write access by default
const mcpToken = await createMCPToken({
  projectId,
  scopes: ['data:read', 'data:write', 'schema:read', 'schema:write'], // Too permissive
  metadata: { purpose: 'AI assistant' }
})
```

**Rationale:** AI tools are powerful but can make mistakes. If an AI agent has write access by default, a single prompt error could delete production data. Read-only by default provides a safety buffer. Write access should be a deliberate, informed choice.

---

### 10. Soft Delete First

**Invariant:** All deletions MUST start with a soft delete grace period. Hard deletes only after grace period expires.

**Explanation:** Users make mistakes. Hard deletes are permanent. Soft deletes provide a recovery window.

**Rules:**
- All deletions start with 30-day grace period
- During grace period, data is marked as `DELETED` but not removed
- Preview shows exactly what will be deleted
- Dependencies are explicitly called out (e.g., "Deleting project will delete: 12 databases, 45 storage buckets, 3 webhooks")
- Restore available during grace period
- Hard delete only after grace period + explicit confirmation
- Critical data (payment records, audit logs) never hard deleted

**Correct Pattern:**
```typescript
// Step 1: Soft delete
async function deleteProject(projectId: string) {
  // Preview: Show what will be deleted
  const preview = await getDeletionPreview(projectId)
  // { databases: 12, buckets: 45, webhooks: 3, rows: '1.2M' }

  // Mark as deleted (soft delete)
  await db.projects.update({
    projectId,
    status: 'DELETED',
    deletedAt: new Date(),
    hardDeleteAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  })

  // Schedule hard delete job
  await enqueueJob('hard_delete_project', { projectId }, {
    delay: 30 * 24 * 60 * 60 * 1000 // 30 days
  })
}

// Step 2: Restore during grace period
async function restoreProject(projectId: string) {
  const project = await db.projects.findUnique({ projectId })
  if (project.status !== 'DELETED') throw new Error('Not deleted')
  if (project.hardDeleteAt < new Date()) throw new Error('Grace period expired')

  await db.projects.update({
    projectId,
    status: 'ACTIVE',
    deletedAt: null,
    hardDeleteAt: null
  })
}
```

**Incorrect Pattern:**
```typescript
// DANGEROUS: Immediate hard delete
async function deleteProject(projectId: string) {
  // No grace period, no recovery, no preview
  await db.projects.delete({ projectId })
  await dropDatabase(`tenant_${projectId}`) // Gone forever
}
```

**Rationale:** Accidental deletions are common. Without a grace period, a single mistake can permanently destroy user data. A 30-day window provides time to realize the error and restore. The preview ensures users understand the consequences before confirming.

---

## Enforcement

### Code Review Checklist

Every PR MUST be reviewed against these invariants:

- [ ] Does this code access the control plane DB directly? (FAIL if yes)
- [ ] Are all destructive operations idempotent?
- [ ] Is every request attributed to a project and actor?
- [ ] Are secrets ever logged? (FAIL if yes)
- [ ] Is cross-project isolation enforced?
- [ ] Do all requests have correlation IDs?
- [ ] Does it fail closed or open on errors?
- [ ] Are MCP tokens read-only by default?
- [ ] Do deletions use soft delete first?

### Automated Testing

Invariants MUST be tested:

```typescript
describe('Platform Invariants', () => {
  it('must not allow direct control DB access from data plane', async () => {
    // Test that data plane services use snapshot API only
  })

  it('must be idempotent for destructive operations', async () => {
    // Call delete twice, should succeed both times
  })

  it('must enforce isolation', async () => {
    // Attempt cross-project access, should return 403
  })

  it('must redact secrets from logs', async () => {
    // Create secret, check logs for secret value (should not exist)
  })
})
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-30 | Initial version - 10 core invariants documented |

---

## Questions or Violations?

If you believe an invariant needs clarification, or if you discover a violation:

1. **Stop:** Do not merge code that violates an invariant
2. **Document:** Create an issue explaining the situation
3. **Discuss:** Engage the platform architecture team
4. **Update:** If the invariant is wrong, update this document first

Invariants can be changed, but the change must be deliberate, discussed, and documented - not accidental.

---

**Remember:** These invariants exist to protect the platform and our users. When in doubt, choose the safer option. Security and correctness are more important than convenience or performance.
