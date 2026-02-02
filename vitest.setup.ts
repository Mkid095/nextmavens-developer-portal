import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi, beforeEach } from 'vitest'

// Clean up after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing'
process.env.REFRESH_SECRET = 'test-refresh-secret-key-for-testing'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.SIGNUPS_ENABLED = 'true'

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}))

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  hash: vi.fn((password: string) => Promise.resolve(`hashed_${password}`)),
  compare: vi.fn((password: string, hash: string) =>
    Promise.resolve(hash === `hashed_${password}`)
  ),
}))

// Mock Resend email service
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  })),
}))

// Mock fetch globally for webhook tests
global.fetch = vi.fn()

// Setup performance API
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),
} as Performance

// Mock crypto.randomUUID for Node < 19
if (!global.crypto.randomUUID) {
  ;(global.crypto.randomUUID as any) = vi.fn(() => 'test-uuid-' + Math.random().toString(36).substring(7))
}

// Mock idempotency library
vi.mock('@/lib/idempotency', () => ({
  withIdempotency: vi.fn((key: string, fn: () => Promise<unknown>) => fn()),
}))
