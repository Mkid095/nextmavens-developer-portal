/**
 * Webhooks module for Control Plane API
 * Manages webhook configurations and delivery
 */

export async function emitEvent(
  projectId: string,
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  // Fire and forget - log the event
  console.log(`[Webhook] Event: ${eventType} for project: ${projectId}`, data)
}

export { createWebhooksTables } from './migrations/create-webhooks-table'
export { createWebhook, getWebhook, updateWebhook, deleteWebhook, listWebhooks, listEventLogs } from './migrations/create-webhooks-table'
