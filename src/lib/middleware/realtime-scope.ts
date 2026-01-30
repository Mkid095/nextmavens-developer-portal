/**
 * Realtime Channel Scoping Middleware
 *
 * Middleware for scoping realtime channels to project-specific prefixes.
 * Enforces project isolation by validating channel subscriptions follow the pattern: project_id:table_name
 *
 * US-003: Prefix Realtime Channels (prd-resource-isolation.json)
 *
 * @example
 * ```typescript
 * import { validateChannelSubscription, buildChannelName } from '@/lib/middleware/realtime-scope';
 *
 * // In a WebSocket connection handler
 * export async function handleSubscribe(req: NextRequest, channel: string) {
 *   const projectId = getProjectIdFromRequest(req);
 *   validateChannelSubscription(channel, projectId);
 *   // Proceed with subscription
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { JwtPayload } from '@/lib/auth';

/**
 * Error codes for realtime channel scoping
 */
export enum RealtimeScopeError {
  MISSING_PROJECT_ID = 'MISSING_PROJECT_ID',
  INVALID_CHANNEL_FORMAT = 'INVALID_CHANNEL_FORMAT',
  CROSS_PROJECT_CHANNEL = 'CROSS_PROJECT_CHANNEL',
  INVALID_CHANNEL_NAME = 'INVALID_CHANNEL_NAME',
}

/**
 * Channel types for realtime subscriptions
 */
export enum ChannelType {
  TABLE = 'table',
  USER = 'user',
  PRESENCE = 'presence',
  BROADCAST = 'broadcast',
}

/**
 * Valid channel patterns
 * project_id:table_name
 * project_id:user:user_id
 * project_id:presence:room_id
 * project_id:broadcast:topic
 */
const CHANNEL_PATTERN = /^([a-f0-9-]+):([a-z_]+):?([a-zA-Z0-9_-]*)$/;

/**
 * Reserved channel names that cannot be used
 */
const RESERVED_CHANNELS = [
  'system',
  'admin',
  'auth',
  'control',
  'internal',
  'global',
  'all',
  '*',
];

/**
 * Maximum channel name length (excluding project_id prefix)
 */
const MAX_CHANNEL_LENGTH = 100;

/**
 * Validate that a channel name follows the expected format
 *
 * Format: project_id:channel_type:channel_identifier
 *
 * @param channel - The channel name to validate
 * @returns Parsed channel parts if valid
 * @throws Error if format is invalid
 */
export function validateChannelFormat(channel: string): {
  projectId: string;
  channelType: string;
  identifier: string;
} {
  if (!channel || typeof channel !== 'string') {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT);
  }

  // Check total length
  if (channel.length > 256) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT);
  }

  // Parse the channel name
  const match = channel.match(CHANNEL_PATTERN);
  if (!match) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT);
  }

  const [, projectId, channelType, identifier = ''] = match;

  // Validate project_id is a valid UUID
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(projectId)) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT);
  }

  // Validate channel type
  if (!Object.values(ChannelType).includes(channelType as ChannelType)) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT);
  }

  // Check for reserved channel names
  if (RESERVED_CHANNELS.includes(channelType) || RESERVED_CHANNELS.includes(identifier)) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_NAME);
  }

  // Validate identifier length
  if (identifier.length > MAX_CHANNEL_LENGTH) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT);
  }

  return {
    projectId,
    channelType,
    identifier,
  };
}

/**
 * Validate that a channel subscription is scoped to the correct project
 *
 * Ensures that a request with project_id can only subscribe to channels
 * prefixed with that same project_id. Returns 403 for cross-project access.
 *
 * @param channel - The channel name to validate
 * @param projectId - The project_id from JWT
 * @throws Error if cross-project access detected
 *
 * @example
 * ```typescript
 * try {
 *   validateChannelSubscription('abc-123:users', 'abc-123');
 *   // Allow subscription
 * } catch (error) {
 *   // Return 403 to client
 * }
 * ```
 */
export function validateChannelSubscription(channel: string, projectId: string): void {
  if (!projectId) {
    throw new Error(RealtimeScopeError.MISSING_PROJECT_ID);
  }

  // Parse and validate channel format
  const parsed = validateChannelFormat(channel);

  // Check if channel belongs to the project
  if (parsed.projectId !== projectId) {
    throw new Error(RealtimeScopeError.CROSS_PROJECT_CHANNEL);
  }
}

/**
 * Build a properly prefixed channel name for a project
 *
 * @param projectId - The project ID
 * @param channelType - The type of channel
 * @param identifier - Optional channel identifier
 * @returns A properly formatted channel name
 *
 * @example
 * ```typescript
 * const channel1 = buildChannelName('abc-123', ChannelType.TABLE, 'users');
 * // Returns: 'abc-123:table:users'
 *
 * const channel2 = buildChannelName('abc-123', ChannelType.USER, 'user-456');
 * // Returns: 'abc-123:user:user-456'
 * ```
 */
export function buildChannelName(
  projectId: string,
  channelType: ChannelType,
  identifier: string = ''
): string {
  if (!projectId) {
    throw new Error(RealtimeScopeError.MISSING_PROJECT_ID);
  }

  if (!Object.values(ChannelType).includes(channelType)) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT);
  }

  // Validate the identifier
  if (identifier && identifier.length > MAX_CHANNEL_LENGTH) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_FORMAT);
  }

  // Check for reserved names
  if (identifier && RESERVED_CHANNELS.includes(identifier)) {
    throw new Error(RealtimeScopeError.INVALID_CHANNEL_NAME);
  }

  return identifier ? `${projectId}:${channelType}:${identifier}` : `${projectId}:${channelType}`;
}

/**
 * Extract project ID from a channel name
 *
 * @param channel - The channel name
 * @returns The project ID or null if invalid
 *
 * @example
 * ```typescript
 * const projectId = extractProjectIdFromChannel('abc-123:users');
 * // Returns: 'abc-123'
 * ```
 */
export function extractProjectIdFromChannel(channel: string): string | null {
  try {
    const parsed = validateChannelFormat(channel);
    return parsed.projectId;
  } catch {
    return null;
  }
}

/**
 * Check if a channel is a system/global channel (not project-scoped)
 *
 * System channels are used for platform-wide broadcasts and are not
 * tied to a specific project.
 *
 * @param channel - The channel name
 * @returns True if the channel is a system channel
 */
export function isSystemChannel(channel: string): boolean {
  // System channels don't have a project_id prefix
  // They start with a reserved keyword
  const systemPrefixes = ['system:', 'global:', 'admin:', 'internal:'];
  return systemPrefixes.some(prefix => channel.startsWith(prefix));
}

/**
 * Validate a realtime connection request
 *
 * Ensures that the request has a valid project_id and returns
 * connection metadata.
 *
 * @param auth - The JWT payload from authentication
 * @returns Connection metadata
 * @throws Error if validation fails
 */
export function validateRealtimeConnection(auth: JwtPayload): {
  projectId: string;
  allowedChannels: string[];
  maxSubscriptions: number;
} {
  if (!auth.project_id) {
    throw new Error(RealtimeScopeError.MISSING_PROJECT_ID);
  }

  return {
    projectId: auth.project_id,
    allowedChannels: [], // Will be populated by subscription requests
    maxSubscriptions: 50, // Per quotas/limits
  };
}

/**
 * Create a WebSocket handshake response with project-scoped channels
 *
 * @param req - Next.js request
 * @param auth - JWT payload
 * @returns Response with connection metadata
 */
export function createRealtimeHandshake(req: NextRequest, auth: JwtPayload): NextResponse {
  try {
    const connection = validateRealtimeConnection(auth);

    return NextResponse.json({
      status: 'connected',
      connection: {
        project_id: connection.projectId,
        max_subscriptions: connection.maxSubscriptions,
        channel_format: 'project_id:channel_type:identifier',
      },
      example_channels: [
        buildChannelName(connection.projectId, ChannelType.TABLE, 'users'),
        buildChannelName(connection.projectId, ChannelType.USER, 'presence'),
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Connection failed',
        code: error.message || 'CONNECTION_FAILED',
      },
      { status: error.message === RealtimeScopeError.MISSING_PROJECT_ID ? 401 : 400 }
    );
  }
}

/**
 * Handle a channel subscription request
 *
 * Validates that the channel subscription is properly scoped and returns
 * an error if cross-project access is attempted.
 *
 * @param req - Next.js request
 * @param channel - Channel to subscribe to
 * @param auth - JWT payload
 * @returns Response indicating success or failure
 */
export function handleChannelSubscription(
  req: NextRequest,
  channel: string,
  auth: JwtPayload
): NextResponse {
  try {
    // Validate channel is scoped to the project
    validateChannelSubscription(channel, auth.project_id);

    const parsed = validateChannelFormat(channel);

    return NextResponse.json({
      status: 'subscribed',
      channel: channel,
      channel_type: parsed.channelType,
      project_id: auth.project_id,
    });
  } catch (error: any) {
    // Return 403 for cross-project access attempts
    if (error.message === RealtimeScopeError.CROSS_PROJECT_CHANNEL) {
      return NextResponse.json(
        {
          error: 'Cross-project channel access denied',
          message: 'Access to other project channels not permitted',
          code: RealtimeScopeError.CROSS_PROJECT_CHANNEL,
        },
        { status: 403 }
      );
    }

    if (error.message === RealtimeScopeError.MISSING_PROJECT_ID) {
      return NextResponse.json(
        {
          error: 'Missing project ID',
          message: 'Project ID is required for channel subscriptions',
          code: RealtimeScopeError.MISSING_PROJECT_ID,
        },
        { status: 401 }
      );
    }

    // Other errors
    return NextResponse.json(
      {
        error: 'Invalid channel subscription',
        message: error.message || 'Channel validation failed',
        code: error.message || RealtimeScopeError.INVALID_CHANNEL_FORMAT,
      },
      { status: 400 }
    );
  }
}

/**
 * Generate all allowed channels for a project
 *
 * Returns a list of channel patterns that a project can subscribe to.
 * Used for client-side validation and documentation.
 *
 * @param projectId - The project ID
 * @returns Array of example channel patterns
 */
export function generateAllowedChannels(projectId: string): string[] {
  return [
    buildChannelName(projectId, ChannelType.TABLE, 'users'),
    buildChannelName(projectId, ChannelType.TABLE, 'posts'),
    buildChannelName(projectId, ChannelType.USER, 'presence'),
    buildChannelName(projectId, ChannelType.PRESENCE, 'room-1'),
    buildChannelName(projectId, ChannelType.BROADCAST, 'updates'),
  ];
}

/**
 * Type for a realtime subscription
 */
export interface RealtimeSubscription {
  channel: string;
  projectId: string;
  channelType: ChannelType;
  identifier: string;
  subscribedAt: Date;
}

/**
 * Active subscriptions store (in-memory for this session)
 * In production, this would be stored in Redis or similar
 */
const activeSubscriptions = new Map<string, RealtimeSubscription>();

/**
 * Add a subscription to the active subscriptions
 *
 * @param subscriptionId - Unique subscription ID
 * @param channel - Channel name
 * @param auth - JWT payload
 * @returns The subscription record
 */
export function addSubscription(
  subscriptionId: string,
  channel: string,
  auth: JwtPayload
): RealtimeSubscription {
  const parsed = validateChannelFormat(channel);

  const subscription: RealtimeSubscription = {
    channel,
    projectId: parsed.projectId,
    channelType: parsed.channelType as ChannelType,
    identifier: parsed.identifier,
    subscribedAt: new Date(),
  };

  activeSubscriptions.set(subscriptionId, subscription);

  return subscription;
}

/**
 * Remove a subscription from active subscriptions
 *
 * @param subscriptionId - Unique subscription ID
 */
export function removeSubscription(subscriptionId: string): void {
  activeSubscriptions.delete(subscriptionId);
}

/**
 * Get all active subscriptions for a project
 *
 * @param projectId - The project ID
 * @returns Array of active subscriptions
 */
export function getProjectSubscriptions(projectId: string): RealtimeSubscription[] {
  return Array.from(activeSubscriptions.values()).filter(
    sub => sub.projectId === projectId
  );
}

/**
 * Clear all subscriptions for a project
 *
 * Useful when a project is suspended or deleted
 *
 * @param projectId - The project ID
 */
export function clearProjectSubscriptions(projectId: string): number {
  let count = 0;
  for (const [id, sub] of activeSubscriptions.entries()) {
    if (sub.projectId === projectId) {
      activeSubscriptions.delete(id);
      count++;
    }
  }
  return count;
}

export default {
  validateChannelFormat,
  validateChannelSubscription,
  buildChannelName,
  extractProjectIdFromChannel,
  isSystemChannel,
  validateRealtimeConnection,
  createRealtimeHandshake,
  handleChannelSubscription,
  generateAllowedChannels,
  addSubscription,
  removeSubscription,
  getProjectSubscriptions,
  clearProjectSubscriptions,
  RealtimeScopeError,
  ChannelType,
};
