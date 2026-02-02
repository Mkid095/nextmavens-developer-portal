/**
 * Realtime Scope Request Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import type { JwtPayload } from '@/lib/auth'
import { RealtimeScopeError } from './constants'
import { validateChannelFormat, buildChannelName, ChannelType } from './channel'

export function validateRealtimeConnection(auth: JwtPayload): {
  projectId: string
  allowedChannels: string[]
  maxSubscriptions: number
} {
  if (!auth.project_id) {
    throw new Error(RealtimeScopeError.MISSING_PROJECT_ID)
  }

  return {
    projectId: auth.project_id,
    allowedChannels: [],
    maxSubscriptions: 50,
  }
}

export function createRealtimeHandshake(req: NextRequest, auth: JwtPayload): NextResponse {
  try {
    const connection = validateRealtimeConnection(auth)

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
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Connection failed',
        code: error.message || 'CONNECTION_FAILED',
      },
      { status: error.message === RealtimeScopeError.MISSING_PROJECT_ID ? 401 : 400 }
    )
  }
}

export function handleChannelSubscription(
  req: NextRequest,
  channel: string,
  auth: JwtPayload
): NextResponse {
  try {
    const { validateChannelSubscription } = require('./channel')
    validateChannelSubscription(channel, auth.project_id)

    const parsed = validateChannelFormat(channel)

    return NextResponse.json({
      status: 'subscribed',
      channel: channel,
      channel_type: parsed.channelType,
      project_id: auth.project_id,
    })
  } catch (error: any) {
    if (error.message === RealtimeScopeError.CROSS_PROJECT_CHANNEL) {
      return NextResponse.json(
        {
          error: 'Cross-project channel access denied',
          message: 'Access to other project channels not permitted',
          code: RealtimeScopeError.CROSS_PROJECT_CHANNEL,
        },
        { status: 403 }
      )
    }

    if (error.message === RealtimeScopeError.MISSING_PROJECT_ID) {
      return NextResponse.json(
        {
          error: 'Missing project ID',
          message: 'Project ID is required for channel subscriptions',
          code: RealtimeScopeError.MISSING_PROJECT_ID,
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        error: 'Invalid channel subscription',
        message: error.message || 'Channel validation failed',
        code: error.message || RealtimeScopeError.INVALID_CHANNEL_FORMAT,
      },
      { status: 400 }
    )
  }
}
