/**
 * Test Helper Utilities
 *
 * Common helper functions for testing
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Add providers here if needed (e.g., ThemeProvider, QueryClientProvider)
  return render(ui, options)
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Create a mock response object
 */
export function createMockResponse(data: unknown, status: number = 200) {
  return {
    data,
    status,
    ok: status >= 200 && status < 300,
    json: async () => data,
    text: async () => JSON.stringify(data),
  }
}

/**
 * Create a mock fetch response
 */
export function createMockFetchResponse(data: unknown, status: number = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({
      'content-type': 'application/json',
    }),
  } as Response
}

/**
 * Mock console methods to reduce noise in tests
 */
export function mockConsole() {
  const originalError = console.error
  const originalWarn = console.warn

  beforeEach(() => {
    console.error = vi.fn()
    console.warn = vi.fn()
  })

  afterEach(() => {
    console.error = originalError
    console.warn = originalWarn
  })
}

/**
 * Get test environment variable
 */
export function getTestEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing test environment variable: ${key}`)
  }
  return value
}

/**
 * Create a test date
 */
export function createTestDate(offsetMs: number = 0): Date {
  return new Date(Date.now() + offsetMs)
}

/**
 * Assert error thrown
 */
export async function assertThrowsAsync(
  fn: () => Promise<unknown>,
  message?: string
): Promise<Error> {
  let error: Error | undefined

  try {
    await fn()
  } catch (e) {
    error = e as Error
  }

  if (!error) {
    throw new Error(`Expected function to throw, but it didn't${message ? `: ${message}` : ''}`)
  }

  if (message && !error.message.includes(message)) {
    throw new Error(`Expected error message to include "${message}", but got "${error.message}"`)
  }

  return error
}

/**
 * Wait for condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error(`Condition not met within ${timeout}ms`)
}

/**
 * Create a mock function that resolves with a value
 */
export function mockResolvedValue<T>(value: T) {
  return vi.fn().mockResolvedValue(value)
}

/**
 * Create a mock function that rejects with an error
 */
export function mockRejectedValue(error: Error) {
  return vi.fn().mockRejectedValue(error)
}
