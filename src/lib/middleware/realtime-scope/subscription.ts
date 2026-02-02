/**
 * Realtime Scope Subscription Management
 */

import type { JwtPayload } from '@/lib/auth'
import { validateChannelFormat } from './channel'
import { ChannelType } from './constants'

export interface RealtimeSubscription {
  channel: string
  projectId: string
  channelType: ChannelType
  identifier: string
  subscribedAt: Date
}

const activeSubscriptions = new Map<string, RealtimeSubscription>()

export function addSubscription(
  subscriptionId: string,
  channel: string,
  auth: JwtPayload
): RealtimeSubscription {
  const parsed = validateChannelFormat(channel)

  const subscription: RealtimeSubscription = {
    channel,
    projectId: parsed.projectId,
    channelType: parsed.channelType as ChannelType,
    identifier: parsed.identifier,
    subscribedAt: new Date(),
  }

  activeSubscriptions.set(subscriptionId, subscription)
  return subscription
}

export function removeSubscription(subscriptionId: string): void {
  activeSubscriptions.delete(subscriptionId)
}

export function getProjectSubscriptions(projectId: string): RealtimeSubscription[] {
  return Array.from(activeSubscriptions.values()).filter(sub => sub.projectId === projectId)
}

export function clearProjectSubscriptions(projectId: string): number {
  let count = 0
  for (const [id, sub] of activeSubscriptions.entries()) {
    if (sub.projectId === projectId) {
      activeSubscriptions.delete(id)
      count++
    }
  }
  return count
}

export function getActiveSubscriptionsCount(): number {
  return activeSubscriptions.size
}

export function getAllSubscriptions(): RealtimeSubscription[] {
  return Array.from(activeSubscriptions.values())
}
