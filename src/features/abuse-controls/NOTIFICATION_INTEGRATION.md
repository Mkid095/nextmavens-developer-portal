# Suspension Notification Integration Guide

This document describes how the suspension notification system integrates with all abuse control features.

## Overview

The notification system is fully integrated with all abuse control features that can suspend projects:

- **US-003**: Auto-suspend on Hard Cap
- **US-004**: Usage Spike Detection
- **US-006**: Malicious Pattern Detection

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Abuse Control Features                   │
├─────────────┬──────────────┬─────────────┬─────────────────┤
│ Hard Cap    │ Usage Spike  │ Error Rate  │ Malicious       │
│ Suspension  │ Detection    │ Detection   │ Pattern         │
│ (US-003)    │ (US-004)     │ (US-005)    │ Detection (006) │
└──────┬──────┴──────┬───────┴──────┬──────┴───────┬─────────┘
       │             │              │              │
       │             │              │              │
       ▼             ▼              │              ▼
┌─────────────┐ ┌─────────────┐    │    ┌─────────────┐
│suspendProject│ │triggerSpike │    │    │triggerSuspension│
│    ()       │ │   Action()  │    │    │ForPattern() │
└──────┬──────┘ └──────┬──────┘    │    └──────┬──────┘
       │                │            │            │
       │                │            │            │
       └────────────────┴────────────┴────────────┘
                     │
                     ▼
          ┌──────────────────┐
          │ suspendProject() │
          │ suspensions.ts   │
          └─────────┬────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ sendSuspensionNotification()│
         │ notifications.ts     │
         └─────────┬────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌──────────────┐      ┌──────────────┐
│ Check User   │      │ Get Project  │
│ Preferences  │      │ Recipients   │
└──────┬───────┘      └──────┬───────┘
       │                     │
       └──────────┬──────────┘
                  ▼
         ┌─────────────────┐
         │ Filter Recipients│
         │ by Preferences  │
         └────────┬────────┘
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
┌─────────────┐     ┌─────────────┐
│Send Email   │     │Create Queue │
│via Resend   │     │Entry        │
└─────────────┘     └─────────────┘
```

## Integration Points

### 1. Hard Cap Suspension (US-003)

**File**: `lib/suspensions.ts`

**Function**: `suspendProject()`

**Integration**:
```typescript
// Line 98 in suspensions.ts
sendSuspensionNotification(projectId, projectName, orgName, reason, new Date())
  .then((results) => {
    const successful = results.filter((r) => r.success).length
    console.log(
      `[Suspensions] Sent ${successful}/${results.length} suspension notifications`
    )
  })
  .catch((error) => {
    console.error(`[Suspensions] Failed to send notification:`, error)
  })
```

**Triggered by**:
- Background job: `checkAllProjectsForSuspension()`
- Direct API call to suspend project
- Manual admin action

**Notification sent**: Always, when project is suspended

### 2. Usage Spike Detection (US-004)

**File**: `lib/spike-detection.ts`

**Function**: `triggerSpikeAction()`

**Integration**:
```typescript
// Line 230 in spike-detection.ts
if (detection.actionTaken === SpikeAction.SUSPEND) {
  await suspendProject(
    detection.projectId,
    {
      cap_type: detection.capType,
      current_value: detection.currentUsage,
      limit_exceeded: Math.floor(detection.averageUsage * SPIKE_THRESHOLD),
      details: detection.details || `Usage spike detected: ${detection.spikeMultiplier}x average`,
    },
    'Auto-suspended due to severe usage spike'
  )
}
```

**Triggered by**:
- Background job: `runSpikeDetection()`
- Severity: CRITICAL or SEVERE
- Spike multiplier: >= 3x average

**Notification sent**: When severity is CRITICAL or SEVERE (triggers suspension)

### 3. Error Rate Detection (US-005)

**File**: `lib/error-rate-detection.ts`

**Current Status**: Does NOT trigger suspension, only investigation

**Integration**: Currently logs warnings and triggers investigation

**Future Enhancement**: Could be enhanced to send warning notifications without suspension

**Triggered by**:
- Background job: `runErrorRateDetection()`
- Error rate: >= 50%
- Severity: CRITICAL or SEVERE

**Notification sent**: None currently (future: warning notifications)

### 4. Malicious Pattern Detection (US-006)

**File**: `lib/pattern-detection.ts`

**Function**: `triggerSuspensionForPattern()`

**Integration**:
```typescript
// Line 481 in pattern-detection.ts
await suspendProject(
  detection.project_id,
  reason,
  `Auto-suspended for ${detection.pattern_type}: ${detection.severity} severity pattern detected`
)
```

**Triggered by**:
- Background job: `runPatternDetection()`
- Pattern types:
  - SQL injection attempts
  - Auth brute force attacks
  - Rapid API key creation
- Severity: CRITICAL or SEVERE
- Action: suspension

**Notification sent**: When severity is CRITICAL or SEVERE (triggers suspension)

## Notification Flow

### 1. Suspension Triggered

Any of the above features calls `suspendProject()`.

### 2. Project Suspended

The `suspendProject()` function:
1. Starts database transaction
2. Inserts suspension record
3. Updates project status to 'suspended'
4. Commits transaction
5. Calls `sendSuspensionNotification()` (non-blocking)

### 3. Notification Sent

The `sendSuspensionNotification()` function:
1. Creates suspension notification template
2. Formats email content
3. Gets notification recipients (owner + org members)
4. **Checks user preferences** (NEW in Step 7)
5. Filters recipients based on preferences
6. Creates notification record in database
7. Sends email to each enabled recipient via Resend
8. Updates notification delivery status

### 4. Preferences Respected

The `getNotificationRecipients()` function (UPDATED in Step 7):
1. Queries all potential recipients (owner + org members)
2. Checks each user's notification preferences
3. Filters out users who have disabled notifications
4. Returns only enabled recipients

## Notification Preferences Integration

### Default Preferences

All users start with default preferences:
- `project_suspended`: ENABLED (email)
- `project_unsuspended`: ENABLED (email)
- `quota_warning`: ENABLED (email)
- `usage_spike_detected`: ENABLED (email)
- `error_rate_detected`: ENABLED (email)
- `malicious_pattern_detected`: ENABLED (email)

### Checking Preferences

```typescript
// In getNotificationRecipients()
const shouldReceive = await shouldReceiveNotification(
  recipient.id,
  NotificationType.PROJECT_SUSPENDED,
  projectId
)

if (shouldReceive) {
  enabledRecipients.push(recipient)
} else {
  console.log(`User ${recipient.id} has opted out of notifications`)
}
```

### Managing Preferences

Users can manage preferences via API:
- `GET /api/notifications/preferences` - Get all preferences
- `PUT /api/notifications/preferences` - Update preferences
- `DELETE /api/notifications/preferences/:type` - Reset to default

## Email Service Integration

### Resend Configuration

**Environment Variables**:
```bash
RESEND_API_KEY=re_xxxxx  # Your Resend API key
RESEND_FROM_EMAIL=noreply@yourdomain.com  # Sender email
```

### Email Sending

```typescript
// In sendEmailNotification()
const result = await sendPlainTextEmail(
  recipient.email,
  subject,
  body
)

if (result.success) {
  // Update notification status to DELIVERED
} else {
  // Update notification status to FAILED with error message
}
```

### Error Handling

- If Resend API is not configured, notification fails gracefully
- Failed notifications are kept in database with status='failed'
- Notification queue processor retries failed notifications up to 3 times

## Testing

### Unit Tests

Run unit tests:
```bash
pnpm test notification-integration.test.ts
```

### Integration Tests

Manual testing checklist is in `notification-integration.test.ts`

### Testing Email Delivery

1. Configure Resend API key
2. Trigger a suspension (any method)
3. Check email inbox
4. Verify email contents
5. Check Resend dashboard for delivery status

## Monitoring

### Notification Statistics

```typescript
// Get queue statistics
const stats = await getQueueStatistics()
console.log(`Pending: ${stats.pending}`)
console.log(`Failed: ${stats.failed}`)
console.log(`Retrying: ${stats.retrying}`)
```

### Log Messages

Look for these log messages:
```
[Notifications] Sending suspension notification for project {projectId}
[Notifications] Created notification {notificationId}
[Notifications] Sent {successful}/{total} suspension notifications
[NotificationPreferences] User {userId} has opted out of {notificationType} notifications
```

## Troubleshooting

### Notifications Not Sending

1. Check `RESEND_API_KEY` is configured
2. Check notification preferences are enabled
3. Check notification queue for failed entries
4. Check logs for errors
5. Verify Resend API status

### Recipients Not Receiving

1. Check user notification preferences
2. Verify user email is valid
3. Check user is in project/organization
4. Check logs for preference filtering

### Notifications Delayed

1. Check notification queue processor is running
2. Check queue statistics
3. Check Resend API rate limits
4. Check database performance

## Future Enhancements

1. **Warning Notifications**: Send warnings before suspensions
2. **Multiple Channels**: Add SMS, in-app, webhook notifications
3. **Batch Notifications**: Group multiple notifications
4. **Notification Digests**: Daily/weekly summaries
5. **Custom Templates**: Per-project notification templates
6. **Snoozing**: Allow users to temporarily disable notifications
