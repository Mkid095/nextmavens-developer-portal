/**
 * Realtime Scope Channel Operations
 */

import {
  RealtimeScopeError,
  ChannelType,
  CHANNEL_PATTERN,
  RESERVED_CHANNELS,
  MAX_CHANNEL_LENGTH,
  SYSTEM_PREFIXES,
} from './constants'

export interface ParsedChannel {
  projectId: string
  channelType: string
  identifier: string
}

export function validateChannelFormat(channel: string): ParsedChannel {
  if (!channel || typeof channel !== 'string') {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT)
  }

  if (channel.length > 256) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT)
  }

  const match = channel.match(CHANNEL_PATTERN)
  if (!match) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT)
  }

  const [, projectId, channelType, identifier = ''] = match

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(projectId)) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT)
  }

  if (!Object.values(ChannelType).includes(channelType as ChannelType)) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT)
  }

  if (RESERVED_CHANNELS.includes(channelType) || RESERVED_CHANNELS.includes(identifier)) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_NAME)
  }

  if (identifier.length > MAX_CHANNEL_LENGTH) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT)
  }

  return { projectId, channelType, identifier }
}

export function validateChannelSubscription(channel: string, projectId: string): void {
  if (!projectId) {
    throw new Error(RealtimeScopeError.MISSING_PROJECT_ID)
  }

  const parsed = validateChannelFormat(channel)

  if (parsed.projectId !== projectId) {
    throw new Error(RealtimeScopeError.CROSS_PROJECT_CHANNEL)
  }
}

export function buildChannelName(
  projectId: string,
  channelType: ChannelType,
  identifier: string = ''
): string {
  if (!projectId) {
    throw new Error(RealtimeScopeError.MISSING_PROJECT_ID)
  }

  if (!Object.values(ChannelType).includes(channelType)) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT)
  }

  if (identifier && identifier.length > MAX_CHANNEL_LENGTH) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT)
  }

  if (identifier && RESERVED_CHANNELS.includes(identifier)) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_NAME)
  }

  return identifier ? `${projectId}:${channelType}:${identifier}` : `${projectId}:${channelType}`
}

export function extractProjectIdFromChannel(channel: string): string | null {
  try {
    const parsed = validateChannelFormat(channel)
    return parsed.projectId
  } catch {
    return null
  }
}

export function isSystemChannel(channel: string): boolean {
  return SYSTEM_PREFIXES.some(prefix => channel.startsWith(prefix))
}

export function generateAllowedChannels(projectId: string): string[] {
  return [
    buildChannelName(projectId, ChannelType.TABLE, 'users'),
    buildChannelName(projectId, ChannelType.TABLE, 'posts'),
    buildChannelName(projectId, ChannelType.USER, 'presence'),
    buildChannelName(projectId, ChannelType.PRESENCE, 'room-1'),
    buildChannelName(projectId, ChannelType.BROADCAST, 'updates'),
  ]
}
