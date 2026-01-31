# Testing Guide

## Overview

This document describes the testing setup for the NextMavens Developer Portal. We use **Vitest** as our test runner with **@testing-library/react** for component testing.

## Test Framework

- **Test Runner:** Vitest 4.x
- **Component Testing:** @testing-library/react
- **DOM Environment:** jsdom
- **Coverage:** v8 (built into Vitest)

## Test Scripts

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

## Test Structure

```
src/
├── __tests__/
│   ├── mocks/           # Mock utilities (database, auth)
│   └── utils/           # Test helpers and factories
├── lib/
│   └── __tests__/       # Library unit tests
├── app/
│   └── api/
│       └── __tests__/   # API route tests
├── features/
│   └── __tests__/       # Feature-specific tests
└── components/
    └── __tests__/       # Component tests (future)
```

## Writing Tests

### Test File Naming

- Unit tests: `*.test.ts` or `*.spec.ts`
- Inside `__tests__` directories: any `*.ts` file

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = functionUnderTest(input)

    // Assert
    expect(result).toBe('expected')
  })
})
```

## Test Utilities

### Mock Utilities

Located in `/home/ken/developer-portal/src/__tests__/mocks/`

#### `database.ts`

```typescript
import { createMockPool, setupMockPool } from '@/__tests__/mocks/database'

// Create mock pool
const pool = createMockPool()

// Set up with default test data
const pool = setupMockPool()

// Set custom mock result
pool.setMockResult('SELECT * FROM users', {
  rows: [{ id: 1, name: 'Test' }]
})
```

#### `auth.ts`

```typescript
import {
  createMockAccessToken,
  createMockAuthRequest,
  createMockDeveloperResponse
} from '@/__tests__/mocks/auth'

// Create mock JWT
const token = createMockAccessToken()

// Create mock request with auth
const request = createMockAuthRequest({ token })

// Create mock developer
const developer = createMockDeveloperResponse()
```

### Test Factories

Located in `/home/ken/developer-portal/src/__tests__/utils/factories.ts`

```typescript
import {
  createTestDeveloper,
  createTestProject,
  createTestApiKey,
  createTestWebhook
} from '@/__tests__/utils/factories'

// Create test data
const developer = createTestDeveloper({ email: 'test@example.com' })
const project = createTestProject({ name: 'Test Project' })
```

## Testing Best Practices

### 1. Test Isolation

Each test should be independent and not rely on other tests:

```typescript
beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks()
})
```

### 2. Descriptive Test Names

```typescript
// Good
it('should return 401 when authentication fails', () => {})

// Bad
it('should work', () => {})
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should create project successfully', async () => {
  // Arrange
  const mockData = createTestProject()
  mockPool.query.mockResolvedValueOnce({ rows: [mockData] })

  // Act
  const result = await createProject(mockData)

  // Assert
  expect(result.id).toBe(mockData.id)
})
```

### 4. Mock External Dependencies

Always mock database, API calls, and external services:

```typescript
vi.mock('@/lib/db')
vi.mock('@/lib/auth')
```

### 5. Test Edge Cases

```typescript
it('should handle empty input', () => {})
it('should handle malformed data', () => {})
it('should handle network errors', () => {})
```

## Coverage Goals

We aim for **80%+ coverage** on critical paths:

- [ ] Authentication (JWT, login, registration)
- [ ] API Keys (generation, validation, scoping)
- [ ] Projects (creation, listing, management)
- [ ] Webhooks (delivery, signature, events)
- [ ] Rate Limiting (IP-based, org-based)

### View Coverage

```bash
pnpm test:coverage
```

Coverage reports are generated in:
- Terminal output (text)
- `coverage/index.html` (HTML report)

## Common Testing Scenarios

### Testing API Routes

```typescript
import { POST } from './route'

it('should handle POST request', async () => {
  const request = createMockRequest({
    email: 'test@example.com',
    password: 'password123'
  })

  const response = await POST(request)
  const data = await response.json()

  expect(response.status).toBe(200)
  expect(data.email).toBe('test@example.com')
})
```

### Testing Database Operations

```typescript
it('should insert user into database', async () => {
  mockPool.query.mockResolvedValueOnce({
    rows: [{ id: 'user-123', email: 'test@example.com' }]
  })

  await createUser({ email: 'test@example.com' })

  expect(mockPool.query).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO users'),
    expect.any(Array)
  )
})
```

### Testing Error Handling

```typescript
it('should handle database errors gracefully', async () => {
  mockPool.query.mockRejectedValue(new Error('Database error'))

  const result = await getUser('user-123')

  expect(result).toBeNull()
})
```

## Debugging Tests

### Run Tests in Debug Mode

```bash
# With watch mode
pnpm test:watch

# With UI
pnpm test:ui
```

### Console Output

Tests can use `console.log` for debugging:

```typescript
it('should debug', () => {
  const data = { foo: 'bar' }
  console.log('Data:', data)
  expect(data.foo).toBe('bar')
})
```

## Environment Variables

Test environment variables are set in `vitest.setup.ts`:

```typescript
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch pushes

All tests must pass before merging.

## Adding New Tests

1. Create test file next to source code or in `__tests__` directory
2. Import dependencies and mocks
3. Write tests following best practices
4. Run tests to verify they pass
5. Check coverage meets targets

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/react)
- [Vitest UI](https://vitest.dev/guide/ui.html)

## Test Status

Current test coverage:
- Auth services: ✅
- API keys: ✅
- Rate limiter: ✅
- Webhooks: ✅
- Projects API: ✅
- Validation: ✅
- Components: 🚧 (In Progress)

Total test files: 10+

Last updated: 2025-01-31
