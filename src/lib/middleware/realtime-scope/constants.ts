/**
 * Realtime Scope Constants
 */

export enum RealtimeScopeError {
  MISSING_PROJECT_ID = 'MISSING_PROJECT_ID',
  INVALID_CHANNEL_FORMAT = 'INVALID_CHANNEL_FORMAT',
  CROSS_PROJECT_CHANNEL = 'CROSS_PROJECT_CHANNEL',
  INVALID_CHANNEL_NAME = 'INVALID_CHANNEL_NAME',
}

export enum ChannelType {
  TABLE = 'table',
  USER = 'user',
  PRESENCE = 'presence',
  BROADCAST = 'broadcast',
}

export const CHANNEL_PATTERN = /^([a-f0-9-]+):([a-z_]+):?([a-zA-Z0-9_-]*)$/

export const RESERVED_CHANNELS = [
  'system',
  'admin',
  'auth',
  'control',
  'internal',
  'global',
  'all',
  '*',
]

export const MAX_CHANNEL_LENGTH = 100

export const SYSTEM_PREFIXES = ['system:', 'global:', 'admin:', 'internal:'] as const
