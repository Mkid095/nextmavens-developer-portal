/**
 * Test Data Factories
 *
 * Factory functions for creating test data
 */

import type { Developer, JwtPayload } from '@/lib/auth'
import type { Webhook, WebhookDeliveryResult } from '@/features/webhooks/types'

/**
 * Factory for creating test developers
 */
export function createTestDeveloper(overrides: Partial<Developer> = {}): Developer {
  return {
    id: 'test-dev-id',
    email: 'test@example.com',
    name: 'Test Developer',
    organization: 'Test Org',
    ...overrides,
  }
}

/**
 * Factory for creating test JWT payloads
 */
export function createTestJwtPayload(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    id: 'test-dev-id',
    email: 'test@example.com',
    project_id: 'test-project-id',
    ...overrides,
  }
}

/**
 * Factory for creating test webhooks
 */
export function createTestWebhook(overrides: Partial<Webhook> = {}): Webhook {
  return {
    id: 'test-webhook-id',
    project_id: 'test-project-id',
    event: 'project.created',
    target_url: 'https://example.com/webhook',
    secret: 'test-webhook-secret',
    enabled: true,
    consecutive_failures: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

/**
 * Factory for creating test webhook delivery results
 */
export function createTestWebhookDeliveryResult(overrides: Partial<WebhookDeliveryResult> = {}): WebhookDeliveryResult {
  return {
    success: true,
    statusCode: 200,
    delivered: true,
    duration: 100,
    ...overrides,
  }
}

/**
 * Factory for creating test API keys
 */
export function createTestApiKey(overrides: {
  id?: string
  project_id?: string
  developer_id?: string
  key_type?: string
  key_prefix?: string
  scopes?: string[]
  environment?: string
  name?: string
  status?: string
} = {}) {
  return {
    id: overrides.id || 'test-key-id',
    project_id: overrides.project_id || 'test-project-id',
    developer_id: overrides.developer_id || 'test-dev-id',
    key_type: overrides.key_type || 'public',
    key_prefix: overrides.key_prefix || 'nm_live_pk',
    scopes: overrides.scopes || ['read:projects'],
    environment: overrides.environment || 'live',
    name: overrides.name || 'Test API Key',
    status: overrides.status || 'active',
    created_at: new Date(),
    updated_at: new Date(),
  }
}

/**
 * Factory for creating test projects
 */
export function createTestProject(overrides: {
  id?: string
  developer_id?: string
  name?: string
  slug?: string
  status?: string
} = {}) {
  return {
    id: overrides.id || 'test-project-id',
    developer_id: overrides.developer_id || 'test-dev-id',
    name: overrides.name || 'Test Project',
    slug: overrides.slug || 'test-project',
    status: overrides.status || 'active',
    created_at: new Date(),
    updated_at: new Date(),
  }
}

/**
 * Factory for creating test rate limit identifiers
 */
export function createTestRateLimitIdentifier(overrides: {
  type?: 'IP' | 'ORG'
  value?: string
} = {}) {
  return {
    type: overrides.type || 'IP',
    value: overrides.value || '127.0.0.1',
  }
}

/**
 * Factory for creating test payloads
 */
export function createTestPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    event_type: 'test.event',
    project_id: 'test-project-id',
    data: { test: 'data' },
    ...overrides,
  }
}
