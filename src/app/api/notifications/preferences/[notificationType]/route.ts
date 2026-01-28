/**
 * Individual Notification Preference API Endpoint
 *
 * GET /api/notifications/preferences/:notificationType
 * - Get a specific notification preference
 *
 * PUT /api/notifications/preferences/:notificationType
 * - Update a specific notification preference
 *
 * DELETE /api/notifications/preferences/:notificationType
 * - Delete a specific notification preference (reverts to default)
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import {
  getNotificationPreference,
  upsertNotificationPreference,
  deleteNotificationPreference,
} from '@/features/abuse-controls/lib/notification-preferences'
import { NotificationType, NotificationChannel } from '@/features/abuse-controls/types'

type RouteContext = {
  params: Promise<{
    notificationType: string
  }>
}

/**
 * GET /api/notifications/preferences/:notificationType
 *
 * Get a specific notification preference
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Get authenticated user
    const user = await authenticateRequest(request)

    const params = await context.params
    const notificationType = params.notificationType as NotificationType

    // Validate notification type
    if (!Object.values(NotificationType).includes(notificationType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid notification type: ${notificationType}`,
        },
        { status: 400 }
      )
    }

    // Get projectId from query params
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || undefined

    // Get preference
    const preference = await getNotificationPreference(user.id, notificationType, projectId)

    // If no preference found, return default
    if (!preference) {
      return NextResponse.json({
        success: true,
        data: {
          notification_type: notificationType,
          enabled: true,
          channels: ['email'],
          project_id: projectId || null,
        },
        isDefault: true,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        notification_type: preference.notification_type,
        enabled: preference.enabled,
        channels: preference.channels,
        project_id: preference.project_id,
      },
      isDefault: false,
    })
  } catch (error) {
    console.error('[API] Error getting notification preference:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get notification preference',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/preferences/:notificationType
 *
 * Update a specific notification preference
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // Get authenticated user
    const user = await authenticateRequest(request)

    const params = await context.params
    const notificationType = params.notificationType as NotificationType

    // Validate notification type
    if (!Object.values(NotificationType).includes(notificationType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid notification type: ${notificationType}`,
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { enabled, channels, projectId } = body

    // Validate input
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'enabled must be a boolean',
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(channels)) {
      return NextResponse.json(
        {
          success: false,
          error: 'channels must be an array',
        },
        { status: 400 }
      )
    }

    // Validate channels
    for (const channel of channels) {
      if (!Object.values(NotificationChannel).includes(channel)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid channel: ${channel}`,
          },
          { status: 400 }
        )
      }
    }

    // Upsert preference
    const id = await upsertNotificationPreference(
      user.id,
      notificationType,
      enabled,
      channels as NotificationChannel[],
      projectId
    )

    return NextResponse.json({
      success: true,
      data: {
        id,
        notification_type: notificationType,
        enabled,
        channels,
        project_id: projectId || null,
      },
    })
  } catch (error) {
    console.error('[API] Error updating notification preference:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update notification preference',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/preferences/:notificationType
 *
 * Delete a specific notification preference (reverts to default)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Get authenticated user
    const user = await authenticateRequest(request)

    const params = await context.params
    const notificationType = params.notificationType as NotificationType

    // Validate notification type
    if (!Object.values(NotificationType).includes(notificationType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid notification type: ${notificationType}`,
        },
        { status: 400 }
      )
    }

    // Get projectId from query params
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || undefined

    // Delete preference
    const deleted = await deleteNotificationPreference(user.id, notificationType, projectId)

    return NextResponse.json({
      success: true,
      data: {
        deleted,
        notification_type: notificationType,
        project_id: projectId || null,
      },
    })
  } catch (error) {
    console.error('[API] Error deleting notification preference:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete notification preference',
      },
      { status: 500 }
    )
  }
}
