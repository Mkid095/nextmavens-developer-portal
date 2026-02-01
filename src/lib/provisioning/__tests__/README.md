# Provisioning Integration Tests

Integration tests for the full provisioning flow with a real database connection.

## Overview

These integration tests verify the complete end-to-end provisioning process:
1. Creating tenant schemas
2. Creating tenant tables (users, audit_log, _migrations)
3. Registering with auth, realtime, and storage services
4. Generating API keys
5. Testing idempotency
6. Testing error handling

## Prerequisites

Before running integration tests, ensure:

1. **PostgreSQL is running** with a test database
2. **Database migrations are applied**:
   ```bash
   npm run db:setup
   ```

3. **DATABASE_URL is set** in `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/nextmavens
   ```

## Running Integration Tests

### Run all integration tests:
```bash
npm run test:integration
```

This is equivalent to:
```bash
INTEGRATION_TEST=true vitest run src/lib/provisioning/__tests__/integration.test.ts
```

### Run integration tests in watch mode:
```bash
INTEGRATION_TEST=true vitest src/lib/provisioning/__tests__/integration.test.ts
```

### Run integration tests with UI:
```bash
INTEGRATION_TEST=true vitest --ui src/lib/provisioning/__tests__/integration.test.ts
```

## Test Structure

The integration tests are organized into the following describe blocks:

### Full Provisioning Flow
- Runs all provisioning steps in sequence
- Verifies tenant schema was created
- Verifies tenant tables were created with proper structure
- Verifies API keys were generated

### Service Registration Metadata
- Verifies auth service configuration is stored in project metadata
- Verifies realtime service configuration is stored
- Verifies storage service configuration is stored

### Idempotency Tests
- Verifies re-running `create_tenant_schema` succeeds
- Verifies re-running `create_tenant_database` succeeds
- Verifies re-running `generate_api_keys` is idempotent

### Error Handling
- Verifies graceful failure when project does not exist
- Verifies graceful failure when slug has invalid characters

### Data Integrity
- Verifies data isolation between tenant schemas
- Tests that data in one tenant's schema is not visible to another

## Cleanup

Integration tests automatically clean up after themselves:
- Delete test provisioning steps
- Delete test API keys
- Drop test tenant schemas
- Delete test projects
- Delete test developers

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `INTEGRATION_TEST` | Yes | `false` | Set to `true` to enable integration tests |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |

## Troubleshooting

### Tests are skipped
Ensure `INTEGRATION_TEST=true` is set when running tests.

### Database connection errors
1. Verify PostgreSQL is running
2. Verify `DATABASE_URL` is correct
3. Verify migrations have been applied: `npm run db:setup`

### Permission errors
Ensure the database user has the following permissions:
- `CREATE SCHEMA`
- `CREATE TABLE`
- `DROP SCHEMA`

### Tests timeout
Integration tests have a 60-second timeout. If tests are timing out:
1. Check database performance
2. Check for slow queries
3. Verify database server is not under heavy load

## Example Output

```
[Integration Test] Starting test run: test-1234567890-abc123
[Integration Test] Database connection verified
[Integration Test] Created test project: <uuid> with slug: integration-test-1234567890-abc123
[Provisioning] Created tenant schema: tenant_integration-test-1234567890-abc123 for project: <uuid>
[Integration Test] Verified tenant schema exists: tenant_integration-test-1234567890-abc123
...
[Integration Test] Cleanup completed
[Integration Test] Database pool closed

✓ src/lib/provisioning/__tests__/integration.test.ts (13 tests)
```

## Continuous Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Integration Tests
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    INTEGRATION_TEST: true
  run: npm run test:integration
```

## Notes

- Integration tests modify the database - always use a test database
- Tests are isolated using unique IDs per test run
- Tests clean up after themselves automatically
- Tests are skipped by default in unit test runs
