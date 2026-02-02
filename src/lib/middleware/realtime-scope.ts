/**
 * Realtime Channel Scoping Middleware
 *
 * Middleware for scoping realtime channels to project-specific prefixes.
 * Enforces project isolation by validating channel subscriptions follow the pattern: project_id:table_name
 *
 * US-003: Prefix Realtime Channels
 */

export {
  RealtimeScopeError,
  ChannelType,
  CHANNEL_PATTERN,
  RESERVED_CHANNELS,
  MAX_CHANNEL_LENGTH,
  SYSTEM_PREFIXES,
} from './realtime-scope/constants'

export {
  validateChannelFormat,
  validateChannelSubscription,
  buildChannelName,
  extractProjectIdFromChannel,
  isSystemChannel,
  generateAllowedChannels,
  type ParsedChannel,
} from './realtime-scope/channel'

export {
  addSubscription,
  removeSubscription,
  getProjectSubscriptions,
  clearProjectSubscriptions,
  getActiveSubscriptionsCount,
  getAllSubscriptions,
  type RealtimeSubscription,
} from './realtime-scope/subscription'

export {
  validateRealtimeConnection,
  createRealtimeHandshake,
  handleChannelSubscription,
} from './realtime-scope/handlers'

export { default } from './realtime-scope/handlers'
