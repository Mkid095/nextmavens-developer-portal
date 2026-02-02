/**
 * Break Glass Notification Templates
 *
 * HTML and plain text email templates for break glass notifications.
 *
 * US-012: Add Break Glass Notifications
 */

import { SUPPORT_EMAIL } from '@/features/abuse-controls/lib/config';

// Re-export from specialized template modules
export {
  type SessionCreatedTemplateParams,
  buildSessionCreatedHtmlTemplate,
  buildSessionCreatedPlainTextTemplate,
} from './templates/session-created';
export {
  type ActionPerformedTemplateParams,
  buildActionPerformedHtmlTemplate,
  buildActionPerformedPlainTextTemplate,
} from './templates/action-performed';
