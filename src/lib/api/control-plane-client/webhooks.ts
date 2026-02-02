/**
 * Control Plane API - Webhooks Module
 * Webhook-related API methods
 */

import type {
  Webhook,
  CreateWebhookRequest,
  CreateWebhookResponse,
  UpdateWebhookRequest,
  ListWebhooksQuery,
  ListWebhooksResponse,
  TestWebhookRequest,
  TestWebhookResponse,
  EventLog,
  ListEventLogsQuery,
  ListEventLogsResponse,
  RequestHeaders,
} from '@/lib/types/webhook.types'
import { BaseControlPlaneClient } from './base-client'

/**
 * Webhooks API mixin
 * Extends the base client with webhook-related methods
 */
export class WebhooksApi extends BaseControlPlaneClient {
  /**
   * List webhooks for a project or all webhooks for the authenticated user
   */
  async listWebhooks(
    query?: ListWebhooksQuery,
    req?: RequestHeaders
  ): Promise<ListWebhooksResponse> {
    const params = new URLSearchParams()
    if (query?.project_id) params.append('project_id', query.project_id)
    if (query?.event) params.append('event', query.event)
    if (query?.enabled !== undefined) params.append('enabled', query.enabled.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.offset) params.append('offset', query.offset.toString())
    const queryString = params.toString()
    const endpoint = `/api/v1/webhooks${queryString ? `?${queryString}` : ''}`
    return this.request<ListWebhooksResponse>(endpoint, {}, req)
  }

  /**
   * Get a single webhook by ID
   */
  async getWebhook(
    webhookId: string,
    req?: RequestHeaders
  ): Promise<{ success: boolean; data: Webhook }> {
    return this.request<{ success: boolean; data: Webhook }>(`/api/v1/webhooks/${webhookId}`, {}, req)
  }

  /**
   * Create a new webhook
   */
  async createWebhook(
    request: CreateWebhookRequest,
    req?: RequestHeaders
  ): Promise<{ success: boolean; data: CreateWebhookResponse }> {
    return this.request<{ success: boolean; data: CreateWebhookResponse }>('/api/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * Update a webhook
   */
  async updateWebhook(
    webhookId: string,
    request: UpdateWebhookRequest,
    req?: RequestHeaders
  ): Promise<{ success: boolean; data: Webhook }> {
    return this.request<{ success: boolean; data: Webhook }>(`/api/v1/webhooks/${webhookId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(
    webhookId: string,
    req?: RequestHeaders
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/v1/webhooks/${webhookId}`, {
      method: 'DELETE',
    }, req)
  }

  /**
   * Test a webhook by sending a test event
   */
  async testWebhook(
    request: TestWebhookRequest,
    req?: RequestHeaders
  ): Promise<TestWebhookResponse> {
    return this.request<TestWebhookResponse>('/api/v1/webhooks/test', {
      method: 'POST',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * List event logs (webhook delivery history)
   */
  async listEventLogs(
    query?: ListEventLogsQuery,
    req?: RequestHeaders
  ): Promise<ListEventLogsResponse> {
    const params = new URLSearchParams()
    if (query?.project_id) params.append('project_id', query.project_id)
    if (query?.webhook_id) params.append('webhook_id', query.webhook_id)
    if (query?.event_type) params.append('event_type', query.event_type)
    if (query?.status) params.append('status', query.status)
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.offset) params.append('offset', query.offset.toString())
    const queryString = params.toString()
    const endpoint = `/api/v1/webhooks/history${queryString ? `?${queryString}` : ''}`
    return this.request<ListEventLogsResponse>(endpoint, {}, req)
  }

  /**
   * Retry a failed webhook delivery
   */
  async retryWebhook(
    request: { event_log_id: string },
    req?: RequestHeaders
  ): Promise<{ success: boolean; data: { id: string; message: string; retry_count: number } }> {
    return this.request<{ success: boolean; data: { id: string; message: string; retry_count: number } }>('/api/v1/webhooks/retry', {
      method: 'POST',
      body: JSON.stringify(request),
    }, req)
  }
}
