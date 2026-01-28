/**
 * Notification Preferences API Endpoint
 *
 * GET /api/notifications/preferences
 * - Get notification preferences for the authenticated user
 * - Query params: projectId (optional)
 *
 * PUT /api/notifications/preferences
 * - Update notification preferences for the authenticated user
 * - Body: { preferences: Array<{notification_type, enabled, channels}>, projectId? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import {
  getNotificationPreferences,
  upsertNotificationPreference,
  getDefaultNotificationPreferences,
} from '@/features/abuse-controls/lib/notification-preferences'
import { NotificationType, NotificationChannel } from '@/features/abuse-controls/types'

/**
 * GET /api/notifications/preferences
 *
 * Get notification preferences for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await authenticateRequest(request)

    // Get projectId from query params
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || undefined

    // Get preferences
    const preferences = await getNotificationPreferences(user.id, projectId)

    // If no preferences found, return defaults
    if (preferences.length === 0) {
      const defaults = getDefaultNotificationPreferences()
      return NextResponse.json({
        success: true,
        data: defaults,
        isDefault: true,
      })
    }

    return NextResponse.json({
      success: true,
      data: preferences.map((pref) => ({
        notification_type: pref.notification_type,
        enabled: pref.enabled,
        channels: pref.channels,
        project_id: pref.project_id,
      })),
      isDefault: false,
    })
  } catch (error) {
    console.error('[API] Error getting notification preferences:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get notification preferences',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/preferences
 *
 * Update notification preferences for the authenticated user
 */
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await authenticateRequest(request)

    // Parse request body
    const body = await request.json()
    const { preferences, projectId } = body

    // Validate input
    if (!Array.isArray(preferences)) {
      return NextResponse.json(
        {
          success: false,
          error: 'preferences must be an array',
        },
        { status: 400 }
      )
    }

    // Validate each preference
    for (const pref of preferences) {
      if (!pref.notification_type || typeof pref.enabled !== 'boolean' || !Array.isArray(pref.channels)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid preference format',
          },
          { status: 400 }
        )
      }

      // Validate notification type
      if (!Object.values(NotificationType).includes(pref.notification_type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid notification type: ${pref.notification_type}`,
          },
          { status: 400 }
        )
      }

      // Validate channels
      for (const channel of pref.channels) {
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
    }

    // Upsert each preference
    const updatedPreferences: Array<{
      id: string
      notification_type: string
      enabled: boolean
      channels: string[]
    }> = []

    for (const pref of preferences) {
      const id = await upsertNotificationPreference(
        user.id,
        pref.notification_type as NotificationType,
        pref.enabled,
        pref.channels as NotificationChannel[],
        projectId
      )

      updatedPreferences.push({
        id,
        notification_type: pref.notification_type,
        enabled: pref.enabled,
        channels: pref.channels,
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
    })
  } catch (error) {
    console.error('[API] Error updating notification preferences:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update notification preferences',
      },
      { status: 500 }
    )
  }
}
