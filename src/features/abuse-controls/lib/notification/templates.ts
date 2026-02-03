/**
 * Notification Templates Module
 * Functions for creating notification templates and formatting content
 */

import type { SuspensionNotificationTemplate, SuspensionReason } from '../../types'

/**
 * Create a suspension notification template
 *
 * @param projectName - The name of the suspended project
 * @param orgName - The name of the organization
 * @param reason - The suspension reason
 * @param suspendedAt - When the suspension occurred
 * @returns Formatted notification template
 */
export function createSuspensionNotificationTemplate(
  projectName: string,
  orgName: string,
  reason: SuspensionReason,
  suspendedAt: Date
): SuspensionNotificationTemplate {
  // Generate resolution steps based on the cap type
  const resolutionSteps: string[] = [
    'Review your usage metrics in the developer dashboard',
    'Identify the source of the exceeded limit',
    'Optimize your application to reduce usage',
    'Consider upgrading your plan if needed',
    'Contact support for assistance',
  ]

  // Add specific steps based on cap type
  switch (reason.cap_type) {
    case 'db_queries_per_day':
      resolutionSteps.unshift(
        'Review your database queries for inefficiencies',
        'Implement query caching where appropriate',
        'Check for N+1 query patterns'
      )
      break
    case 'realtime_connections':
      resolutionSteps.unshift(
        'Review your realtime connection management',
        'Implement connection pooling',
        'Ensure connections are properly closed'
      )
      break
    case 'storage_uploads_per_day':
      resolutionSteps.unshift(
        'Review your file upload patterns',
        'Implement file compression',
        'Consider batching uploads'
      )
      break
    case 'function_invocations_per_day':
      resolutionSteps.unshift(
        'Review your function invocation patterns',
        'Implement function result caching',
        'Check for unintended recursive calls'
      )
      break
  }

  return {
    project_name: projectName,
    org_name: orgName,
    reason,
    suspended_at: suspendedAt,
    support_contact: 'support@example.com',
    resolution_steps: resolutionSteps,
  }
}

/**
 * Format suspension notification email content
 *
 * @param template - The suspension notification template
 * @returns Formatted email subject and body
 */
export function formatSuspensionNotificationEmail(
  template: SuspensionNotificationTemplate
): { subject: string; body: string } {
  const { project_name, org_name, reason, suspended_at, support_contact, resolution_steps } =
    template

  const subject = `[URGENT] Project "${project_name}" Suspended - ${org_name}`

  const body = `
IMPORTANT: Your project has been suspended

Project: ${project_name}
Organization: ${org_name}
Suspended At: ${suspended_at.toLocaleString()}
Reason: ${reason.details || `Exceeded ${reason.cap_type} limit`}

Violation Details:
- Limit Exceeded: ${reason.cap_type}
- Current Usage: ${reason.current_value.toLocaleString()}
- Limit: ${reason.limit_exceeded.toLocaleString()}

What Happened:
Your project has exceeded its hard cap for ${reason.cap_type}. To protect the platform
and other users, the project has been automatically suspended.

How to Resolve This Issue:
${resolution_steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Need Help?
If you believe this suspension is in error or need assistance resolving this issue,
please contact our support team at ${support_contact}.

Please include your project ID and organization name in your correspondence.

---
This is an automated notification. Please do not reply directly to this email.
`.trim()

  return { subject, body }
}
