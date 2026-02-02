/**
 * Vitest setup for integration tests
 *
 * This setup file is used for integration tests that require
 * a real database connection. It loads environment variables
 * from .env.local and sets up minimal mocking.
 */

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Clean up after each test
afterEach(() => {
  cleanup()
})

// Load real environment variables from .env.local for integration tests
// Only override if INTEGRATION_TEST is set
if (process.env.INTEGRATION_TEST === 'true') {
  // Import dotenv to load .env.local
  // We need to load this before any database operations
  const fs = require('fs')
  const path = require('path')

  const envLocalPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf-8')
    envContent.split('\n').forEach((line: string) => {
      const [key, ...valueParts] = line.split('=')
      const value = valueParts.join('=')
      if (key && !key.startsWith('#') && value) {
        process.env[key.trim()] = value.trim()
      }
    })
    console.log('[Integration Test Setup] Loaded environment from .env.local')
  }

  // Set real DATABASE_URL for integration tests
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required for integration tests. ' +
      'Set it in .env.local or as an environment variable.'
    )
  }

  console.log('[Integration Test Setup] Using database:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))
}

// Mock Next.js headers (still needed for integration tests)
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}))

// Mock crypto.randomUUID for Node < 19 (fallback)
if (!global.crypto.randomUUID) {
  ;(global.crypto.randomUUID as any) = vi.fn(() => 'test-uuid-' + Math.random().toString(36).substring(7))
}

// Setup performance API
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),
} as Performance

// Note: We DO NOT mock bcrypt, pg, or other libraries for integration tests
// These should use real implementations when testing with a real database
