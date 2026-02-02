/**
 * Break Glass Notification Builders
 *
 * Builds notification data objects from input parameters.
 *
 * US-012: Add Break Glass Notifications
 */

import { formatDate, formatAccessMethod, formatAction, formatTargetType } from './utils';
import type { SessionCreatedTemplateParams, ActionPerformedTemplateParams } from './templates';

/**
 * Break glass session created notification parameters
 */
export interface BreakGlassSessionCreatedParams {
  /** Admin email address who initiated the session */
  adminEmail: string;
  /** Admin developer ID */
  adminId: string;
  /** Break glass session ID */
  sessionId: string;
  /** Reason provided for break glass access */
  reason: string;
  /** Access method used (hardware_key, otp, emergency_code) */
  accessMethod: string;
  /** When the session expires */
  expiresAt: Date;
  /** IP address of the admin (optional) */
  ipAddress?: string;
}

/**
 * Break glass action notification parameters
 */
export interface BreakGlassActionParams {
  /** Admin email address who performed the action */
  adminEmail: string;
  /** Admin developer ID */
  adminId: string;
  /** Break glass session ID */
  sessionId: string;
  /** Reason from the session */
  sessionReason: string;
  /** Action performed (unlock_project, override_suspension, etc.) */
  action: string;
  /** Target type (project, api_key, etc.) */
  targetType: string;
  /** Target ID */
  targetId: string;
  /** State before the action */
  beforeState: Record<string, unknown>;
  /** State after the action */
  afterState: Record<string, unknown>;
  /** IP address of the admin (optional) */
  ipAddress?: string;
}

/**
 * Built notification data for session created
 */
export interface BuiltSessionCreatedNotification {
  subject: string;
  htmlBody: string;
  plainTextBody: string;
}

/**
 * Built notification data for action performed
 */
export interface BuiltActionPerformedNotification {
  subject: string;
  htmlBody: string;
  plainTextBody: string;
}

/**
 * Build session created notification data
 *
 * @param params - Raw notification parameters
 * @returns Built notification with subject and body content
 */
export function buildSessionCreatedNotification(
  params: BreakGlassSessionCreatedParams
): BuiltSessionCreatedNotification {
  const { adminEmail, sessionId, accessMethod, expiresAt, ipAddress } = params;

  const accessMethodDisplay = formatAccessMethod(accessMethod);
  const expiresAtFormatted = formatDate(expiresAt);

  const subject = `[ALERT] Break Glass Session Created by ${adminEmail}`;

  // Import template builders
  const { buildSessionCreatedHtmlTemplate, buildSessionCreatedPlainTextTemplate } = require('./templates');

  const templateParams: SessionCreatedTemplateParams = {
    adminEmail: params.adminEmail,
    adminId: params.adminId,
    sessionId: params.sessionId,
    reason: params.reason,
    accessMethodDisplay,
    expiresAtFormatted,
    ipAddress,
  };

  const htmlBody = buildSessionCreatedHtmlTemplate(templateParams);
  const plainTextBody = buildSessionCreatedPlainTextTemplate(templateParams);

  return {
    subject,
    htmlBody,
    plainTextBody,
  };
}

/**
 * Build action performed notification data
 *
 * @param params - Raw notification parameters
 * @returns Built notification with subject and body content
 */
export function buildActionPerformedNotification(
  params: BreakGlassActionParams
): BuiltActionPerformedNotification {
  const { adminEmail, action, sessionId, ipAddress } = params;

  const actionDisplay = formatAction(action);
  const targetTypeDisplay = formatTargetType(params.targetType);
  const timestamp = formatDate(new Date());

  const subject = `[ALERT] Break Glass Action Performed: ${actionDisplay}`;

  // Import template builders
  const { buildActionPerformedHtmlTemplate, buildActionPerformedPlainTextTemplate } = require('./templates');

  const templateParams: ActionPerformedTemplateParams = {
    actionDisplay,
    adminEmail: params.adminEmail,
    adminId: params.adminId,
    sessionId: params.sessionId,
    targetTypeDisplay,
    targetId: params.targetId,
    sessionReason: params.sessionReason,
    beforeState: params.beforeState,
    afterState: params.afterState,
    timestamp,
    ipAddress,
  };

  const htmlBody = buildActionPerformedHtmlTemplate(templateParams);
  const plainTextBody = buildActionPerformedPlainTextTemplate(templateParams);

  return {
    subject,
    htmlBody,
    plainTextBody,
  };
}
