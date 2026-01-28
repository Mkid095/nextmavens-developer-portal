# Suspension Notification System

## Overview

The suspension notification system automatically sends email notifications when projects are suspended due to hard cap violations. This system ensures project owners and organization members are promptly informed about suspensions and how to resolve them.

## Architecture

### Components

1. **Notification Library** (`lib/notifications.ts`)
   - Core notification management functions
   - Email template generation
   - Delivery tracking and status updates

2. **Email Service** (`lib/email-service.ts`)
   - Resend API integration for email delivery
   - Batch email sending capabilities
   - Email validation and error handling

3. **Notification Preferences** (`lib/notification-preferences.ts`)
   - User notification preferences management
   - Channel selection (email, SMS, in-app, webhook)
   - Opt-out/opt-in functionality

4. **Suspension Integration** (`lib/suspensions.ts`)
   - Automatic notification triggering on suspension
   - Non-blocking notification delivery

### Database Schema

#### `notifications` Table
Tracks all notifications sent for abuse control events.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  channels VARCHAR(50)[] NOT NULL DEFAULT ARRAY['email'],
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
)
```

**Indexes:**
- `idx_notifications_project_id` - Fast lookups by project
- `idx_notifications_status` - Filter pending/failed notifications
- `idx_notifications_created_at` - Time-based queries
- `idx_notifications_type` - Filter by notification type
- `idx_notifications_retry` - Composite index for retry queries

#### `notification_preferences` Table
Manages user notification preferences.

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  channels VARCHAR(50)[] NOT NULL DEFAULT ARRAY['email'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, project_id, notification_type)
)
```

## Notification Types

### Suspension Notification

Sent when a project is automatically suspended due to hard cap violations.

**Email Content Includes:**
- Project name and organization
- Suspension timestamp
- Reason for suspension (which cap was exceeded)
- Current usage vs. limit
- Specific resolution steps based on cap type
- Support contact information

**Resolution Steps by Cap Type:**

1. **Database Queries Per Day**
   - Review database queries for inefficiencies
   - Implement query caching where appropriate
   - Check for N+1 query patterns
   - Review usage metrics in dashboard
   - Identify source of exceeded limit
   - Optimize application to reduce usage
   - Consider upgrading plan if needed
   - Contact support for assistance

2. **Realtime Connections**
   - Review realtime connection management
   - Implement connection pooling
   - Ensure connections are properly closed
   - Review usage metrics in dashboard
   - Identify source of exceeded limit
   - Optimize application to reduce usage
   - Consider upgrading plan if needed
   - Contact support for assistance

3. **Storage Uploads Per Day**
   - Review file upload patterns
   - Implement file compression
   - Consider batching uploads
   - Review usage metrics in dashboard
   - Identify source of exceeded limit
   - Optimize application to reduce usage
   - Consider upgrading plan if needed
   - Contact support for assistance

4. **Function Invocations Per Day**
   - Review function invocation patterns
   - Implement function result caching
   - Check for unintended recursive calls
   - Review usage metrics in dashboard
   - Identify source of exceeded limit
   - Optimize application to reduce usage
   - Consider upgrading plan if needed
   - Contact support for assistance

## Usage

### Automatic Suspension Notifications

When a project is suspended using the `suspendProject()` function, notifications are automatically sent:

```typescript
import { suspendProject } from '@/features/abuse-controls/lib/suspensions'

const reason: SuspensionReason = {
  cap_type: HardCapType.DB_QUERIES_PER_DAY,
  current_value: 15000,
  limit_exceeded: 10000,
  details: 'Project exceeded database queries per day limit'
}

// This automatically triggers notification sending
await suspendProject(projectId, reason, 'Auto-suspended by background job')
```

### Manual Notification Sending

Send suspension notifications manually:

```typescript
import { sendSuspensionNotification } from '@/features/abuse-controls/lib/notifications'

const results = await sendSuspensionNotification(
  projectId,
  projectName,
  orgName,
  reason,
  new Date()
)

console.log(`Sent ${results.filter(r => r.success).length}/${results.length} notifications`)
```

### Creating Custom Notifications

Create and send custom notifications:

```typescript
import { createNotification, sendEmailNotification } from '@/features/abuse-controls/lib/notifications'
import { NotificationType, NotificationPriority, NotificationChannel } from '@/features/abuse-controls/types'

// Create notification record
const notificationId = await createNotification(
  projectId,
  NotificationType.PROJECT_SUSPENDED,
  NotificationPriority.HIGH,
  'Project Suspended',
  'Your project has been suspended...',
  { reason },
  [NotificationChannel.EMAIL]
)

// Send email
const result = await sendEmailNotification(
  'user@example.com',
  'Project Suspended',
  'Your project has been suspended...'
)
```

## Configuration

### Environment Variables

```bash
# Resend API Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@example.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### Default Preferences

New users automatically receive these default notification preferences:

```typescript
[
  { notification_type: 'project_suspended', enabled: true, channels: ['email'] },
  { notification_type: 'project_unsuspended', enabled: true, channels: ['email'] },
  { notification_type: 'quota_warning', enabled: true, channels: ['email'] },
  { notification_type: 'usage_spike_detected', enabled: true, channels: ['email'] },
  { notification_type: 'error_rate_detected', enabled: true, channels: ['email'] },
  { notification_type: 'malicious_pattern_detected', enabled: true, channels: ['email'] }
]
```

## Recipients

Suspension notifications are sent to:

1. **Project Owner** - The user who owns the project
2. **Organization Members** - All members of the organization

Recipients can opt-out of notifications using notification preferences.

## Delivery Tracking

### Notification Statuses

- `pending` - Notification is queued for delivery
- `delivered` - Notification successfully delivered
- `failed` - Notification delivery failed
- `retrying` - Notification is being retried

### Retry Logic

Failed notifications are automatically retried up to 3 times:

```typescript
import { retryFailedNotifications } from '@/features/abuse-controls/lib/notifications'

const retriedCount = await retryFailedNotifications(3)
console.log(`Retried ${retriedCount} failed notifications`)
```

## Testing

Run notification system tests:

```bash
# Run all tests
ts-node src/features/abuse-controls/lib/test-notification-system.ts

# Test individual functions
import { testCreateSuspensionNotificationTemplate } from '@/features/abuse-controls/lib/test-notification-system'
await testCreateSuspensionNotificationTemplate()
```

## Monitoring

### Get Notification Statistics

```typescript
import { getNotificationStatistics } from '@/features/abuse-controls/migrations/create-notifications-table'

const stats = await getNotificationStatistics()
console.log(stats.data)
// {
//   total_notifications: 150,
//   pending_count: 5,
//   delivered_count: 140,
//   failed_count: 5,
//   last_24h_count: 25,
//   last_7d_count: 120
// }
```

### Get Project Notifications

```typescript
import { getProjectNotifications } from '@/features/abuse-controls/lib/notifications'

const notifications = await getProjectNotifications(projectId, 50)
console.log(`Found ${notifications.length} notifications`)
```

## Error Handling

The notification system is designed to be resilient:

1. **Non-blocking Delivery** - Notification failures don't block suspension operations
2. **Retry Logic** - Failed notifications are automatically retried
3. **Error Logging** - All errors are logged for debugging
4. **Graceful Degradation** - System continues working even if email service is unavailable

Example error handling:

```typescript
try {
  await sendSuspensionNotification(projectId, projectName, orgName, reason, new Date())
} catch (error) {
  console.error('Failed to send suspension notification:', error)
  // Suspension still succeeds, notification failure is logged
}
```

## Best Practices

1. **Always use the notification functions** - Don't bypass the notification system
2. **Respect user preferences** - Check notification preferences before sending
3. **Monitor delivery rates** - Track failed notifications and investigate issues
4. **Test locally** - Use test functions to verify notification content
5. **Keep templates updated** - Ensure resolution steps are accurate and helpful

## Troubleshooting

### Notifications Not Sending

1. Check Resend API key is configured: `process.env.RESEND_API_KEY`
2. Verify email addresses are valid
3. Check notification preferences for recipients
4. Review error messages in notification records
5. Verify database connectivity

### High Failure Rate

1. Check Resend service status
2. Verify email domain reputation
3. Review rate limits
4. Check notification template content
5. Monitor database performance

### Missing Recipients

1. Verify users exist in database
2. Check organization membership
3. Review notification preferences
4. Ensure emails are not null/empty

## Future Enhancements

Potential improvements to consider:

1. **HTML Email Templates** - Rich, branded email notifications
2. **SMS Notifications** - Text message notifications for critical events
3. **In-App Notifications** - Real-time notifications in the dashboard
4. **Webhook Support** - Custom webhook integrations
5. **Notification Digests** - Batched notifications to reduce email volume
6. **Customizable Templates** - User-configurable notification content
7. **Multi-Language Support** - Notifications in multiple languages
8. **Analytics Dashboard** - Visualization of notification metrics

## References

- [US-007 - Send Suspension Notifications](../../../../../docs/prd-abuse-controls.json#US-007)
- [Suspension System Documentation](./SUSPENSION_SYSTEM.md)
- [Email Service Documentation](./EMAIL_SERVICE.md)
- [Notification Preferences Documentation](./NOTIFICATION_PREFERENCES.md)
