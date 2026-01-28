/**
 * Data Layer Integration for Abuse Controls
 *
 * This module provides centralized access to quota management, enforcement,
 * spike detection, and suspension management for integration with other parts
 * of the application.
 */

import {
  getProjectQuotas,
  setProjectQuota,
  getProjectQuotaStats,
  applyDefaultQuotas,
  resetProjectQuotas,
} from './quotas'
import {
  checkQuota,
  checkMultipleQuotas,
  canPerformOperation,
  recordUsage,
  getQuotaViolations,
} from './enforcement'
import {
  suspendProject,
  unsuspendProject,
  getSuspensionStatus,
  getAllActiveSuspensions,
  getSuspensionHistory,
} from './suspensions'
import {
  calculateAverageUsage,
  detectUsageSpike,
  checkProjectForSpikes,
  checkAllProjectsForSpikes,
  triggerSpikeAction,
  runSpikeDetection,
  recordUsageMetric,
  recordUsageMetrics,
  getSpikeDetectionHistory,
  getSpikeDetectionSummary,
  checkProjectSpikeStatus,
} from './spike-detection'
import {
  calculateErrorRate,
  detectHighErrorRate,
  checkProjectForHighErrorRate,
  checkAllProjectsForHighErrorRates,
  runErrorRateDetection,
  getErrorRateDetectionConfig,
  getErrorRateDetectionHistory,
  checkProjectErrorRateStatus,
  recordErrorMetrics,
  getErrorRateDetectionSummary,
} from './error-rate-detection'
import {
  checkProjectForMaliciousPatterns,
  checkAllProjectsForMaliciousPatterns,
  runPatternDetection,
  getPatternDetectionConfig,
  getPatternDetectionSummary,
} from './pattern-detection'
import { logPatternDetection, getPatternDetections, getPatternDetectionStatistics } from '../migrations/create-pattern-detections-table'
import { getPatternDetectionConfig as getPatternDetectionConfigFromDb } from '../migrations/create-pattern-detection-config-table'
import {
  sendSuspensionNotification,
  getNotificationRecipients,
  createSuspensionNotificationTemplate,
  formatSuspensionNotificationEmail,
  createNotification,
  getNotification,
  getProjectNotifications,
  retryFailedNotifications,
} from './notifications'
import {
  getNotificationPreferences,
  getNotificationPreference,
  upsertNotificationPreference,
  deleteNotificationPreference,
  getDefaultNotificationPreferences,
  applyDefaultNotificationPreferences,
  shouldReceiveNotification,
  getEnabledChannels,
} from './notification-preferences'
import {
  performManualOverride,
  getOverrideHistory,
  getAllOverrides,
  getOverrideStatistics,
  getOverrideById,
  validateManualOverrideRequest,
} from './manual-overrides'
import { HardCapType, SpikeSeverity } from '../types'
import type {
  SuspensionRecord,
  SuspensionReason,
  SpikeDetectionResult,
  SpikeDetectionJobResult,
  ErrorRateDetectionResult,
  ErrorRateDetectionJobResult,
  PatternDetectionResult,
  PatternDetectionJobResult,
  Notification,
  NotificationRecipient,
  NotificationDeliveryResult,
  ManualOverrideRequest,
  ManualOverrideResult,
  OverrideRecord,
} from '../types'

/**
 * Quota Manager - Main interface for quota operations
 */
export class QuotaManager {
  /**
   * Initialize quotas for a new project
   */
  static async initializeProject(projectId: string): Promise<void> {
    await applyDefaultQuotas(projectId)
  }

  /**
   * Get quota configuration for a project
   */
  static async getQuotas(projectId: string) {
    return getProjectQuotas(projectId)
  }

  /**
   * Get quota statistics for a project
   */
  static async getStats(projectId: string) {
    return getProjectQuotaStats(projectId)
  }

  /**
   * Update a quota for a project
   */
  static async updateQuota(
    projectId: string,
    capType: HardCapType,
    value: number
  ) {
    return setProjectQuota(projectId, capType, value)
  }

  /**
   * Reset all quotas for a project to defaults
   */
  static async resetToDefaults(projectId: string) {
    return resetProjectQuotas(projectId)
  }

  /**
   * Check if an operation is allowed
   */
  static async isAllowed(
    projectId: string,
    operationType: HardCapType
  ): Promise<boolean> {
    return canPerformOperation(projectId, operationType)
  }

  /**
   * Check quota with detailed information
   */
  static async checkWithDetails(
    projectId: string,
    capType: HardCapType,
    currentUsage: number
  ) {
    return checkQuota(projectId, capType, currentUsage)
  }

  /**
   * Record usage for an operation
   */
  static async record(
    projectId: string,
    capType: HardCapType,
    amount: number = 1
  ): Promise<void> {
    await recordUsage(projectId, capType, amount)
  }

  /**
   * Get all active violations for a project
   */
  static async getViolations(projectId: string) {
    return getQuotaViolations(projectId)
  }
}

/**
 * Middleware helper for quota enforcement in API routes
 */
export async function withQuotaCheck<T>(
  projectId: string,
  operationType: HardCapType,
  operation: () => Promise<T>
): Promise<T> {
  // Check if operation is allowed
  const allowed = await canPerformOperation(projectId, operationType)

  if (!allowed) {
    throw new QuotaExceededError(
      operationType,
      projectId
    )
  }

  // Perform the operation
  const result = await operation()

  // Record usage
  await recordUsage(projectId, operationType, 1)

  return result
}

/**
 * Custom error for quota violations
 */
export class QuotaExceededError extends Error {
  constructor(
    public readonly capType: HardCapType,
    public readonly projectId: string
  ) {
    super(`Quota exceeded for ${capType} on project ${projectId}`)
    this.name = 'QuotaExceededError'
  }
}

/**
 * React Hook friendly quota checker (for client-side usage)
 * Note: This would be used with SWR or React Query
 */
export function createQuotaChecker(projectId: string) {
  return {
    check: async (operationType: HardCapType) => {
      return canPerformOperation(projectId, operationType)
    },
    getQuotas: async () => {
      return getProjectQuotas(projectId)
    },
    getStats: async () => {
      return getProjectQuotaStats(projectId)
    },
  }
}

/**
 * Suspension Manager - Main interface for suspension operations
 */
export class SuspensionManager {
  /**
   * Suspend a project
   */
  static async suspend(
    projectId: string,
    reason: SuspensionReason,
    notes?: string
  ): Promise<void> {
    await suspendProject(projectId, reason, notes)
  }

  /**
   * Unsuspend a project
   */
  static async unsuspend(projectId: string, notes?: string): Promise<void> {
    await unsuspendProject(projectId, notes)
  }

  /**
   * Get suspension status for a project
   */
  static async getStatus(projectId: string): Promise<SuspensionRecord | null> {
    return getSuspensionStatus(projectId)
  }

  /**
   * Check if a project is currently suspended
   */
  static async isSuspended(projectId: string): Promise<boolean> {
    const status = await getSuspensionStatus(projectId)
    return status !== null
  }

  /**
   * Get all active suspensions
   */
  static async getAllActive(): Promise<SuspensionRecord[]> {
    return getAllActiveSuspensions()
  }

  /**
   * Get suspension history for a project
   */
  static async getHistory(
    projectId: string
  ): Promise<Array<{ action: string; occurred_at: Date; reason: SuspensionReason }>> {
    return getSuspensionHistory(projectId)
  }

  /**
   * Suspend a project for exceeding a specific cap
   */
  static async suspendForCapViolation(
    projectId: string,
    capType: HardCapType,
    currentValue: number,
    limit: number,
    details?: string
  ): Promise<void> {
    const reason: SuspensionReason = {
      cap_type: capType,
      current_value: currentValue,
      limit_exceeded: limit,
      details,
    }
    await suspendProject(projectId, reason, `Auto-suspended for exceeding ${capType}`)
  }
}

/**
 * Middleware helper for suspension checks in API routes
 */
export async function withSuspensionCheck<T>(
  projectId: string,
  operation: () => Promise<T>
): Promise<T> {
  // Check if project is suspended
  const suspension = await getSuspensionStatus(projectId)

  if (suspension) {
    throw new ProjectSuspendedError(
      projectId,
      suspension.cap_exceeded,
      suspension.reason
    )
  }

  // Perform the operation
  return operation()
}

/**
 * Custom error for suspended projects
 */
export class ProjectSuspendedError extends Error {
  constructor(
    public readonly projectId: string,
    public readonly capExceeded: HardCapType,
    public readonly reason: SuspensionReason
  ) {
    super(
      `Project ${projectId} is suspended due to exceeding ${capExceeded} limit. ${reason.details || ''}`
    )
    this.name = 'ProjectSuspendedError'
  }
}

/**
 * Spike Detection Manager - Main interface for spike detection operations
 */
export class SpikeDetectionManager {
  /**
   * Calculate average usage for a project over a time period
   */
  static async calculateAverage(
    projectId: string,
    metricType: string,
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    return calculateAverageUsage(projectId, metricType, startTime, endTime)
  }

  /**
   * Detect if current usage exceeds the threshold based on average
   */
  static async detectSpike(
    projectId: string,
    metricType: string,
    currentUsage: number,
    thresholdMultiplier?: number
  ): Promise<SpikeDetectionResult> {
    return detectUsageSpike(projectId, metricType, currentUsage, thresholdMultiplier)
  }

  /**
   * Check all metric types for a single project
   */
  static async checkProject(projectId: string): Promise<SpikeDetectionResult[]> {
    return checkProjectForSpikes(projectId)
  }

  /**
   * Check all projects for usage spikes
   */
  static async checkAllProjects(): Promise<SpikeDetectionResult[]> {
    return checkAllProjectsForSpikes()
  }

  /**
   * Trigger action based on spike detection result
   */
  static async triggerAction(detection: SpikeDetectionResult): Promise<boolean> {
    return triggerSpikeAction(detection)
  }

  /**
   * Run the spike detection background job
   */
  static async runBackgroundJob(): Promise<SpikeDetectionJobResult> {
    return runSpikeDetection()
  }

  /**
   * Record a usage metric for spike detection
   */
  static async recordMetric(
    projectId: string,
    metricType: string,
    metricValue: number
  ): Promise<void> {
    await recordUsageMetric(projectId, metricType, metricValue)
  }

  /**
   * Batch record usage metrics for a project
   */
  static async recordMetrics(
    projectId: string,
    metrics: Partial<Record<HardCapType, number>>
  ): Promise<void> {
    await recordUsageMetrics(projectId, metrics)
  }

  /**
   * Get spike detection history for a project
   */
  static async getHistory(
    projectId: string,
    hours?: number
  ): Promise<SpikeDetectionResult[]> {
    return getSpikeDetectionHistory(projectId, hours)
  }

  /**
   * Get spike detection summary across all projects
   */
  static async getSummary(): Promise<{
    totalProjects: number
    activeDetections: number
    recentSuspensions: number
    bySeverity: Record<string, number>
  }> {
    return getSpikeDetectionSummary()
  }

  /**
   * Check a specific project's current spike status
   */
  static async checkCurrentStatus(projectId: string): Promise<SpikeDetectionResult[]> {
    return checkProjectSpikeStatus(projectId)
  }
}

/**
 * Error Rate Detection Manager - Main interface for error rate detection operations
 */
export class ErrorRateDetectionManager {
  /**
   * Calculate error rate for a project over a time period
   */
  static async calculateErrorRate(
    projectId: string,
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    return calculateErrorRate(projectId, startTime, endTime)
  }

  /**
   * Detect if error rate exceeds the threshold
   */
  static async detectHighErrorRate(
    projectId: string,
    totalRequests: number,
    errorCount: number,
    thresholdPercentage?: number
  ): Promise<ErrorRateDetectionResult> {
    return detectHighErrorRate(projectId, totalRequests, errorCount, thresholdPercentage)
  }

  /**
   * Check a single project for high error rates
   */
  static async checkProject(projectId: string): Promise<ErrorRateDetectionResult | null> {
    return checkProjectForHighErrorRate(projectId)
  }

  /**
   * Check all projects for high error rates
   */
  static async checkAllProjects(): Promise<ErrorRateDetectionResult[]> {
    return checkAllProjectsForHighErrorRates()
  }

  /**
   * Run the error rate detection background job
   */
  static async runBackgroundJob(): Promise<ErrorRateDetectionJobResult> {
    return runErrorRateDetection()
  }

  /**
   * Record error metrics for a project
   */
  static async recordMetrics(
    projectId: string,
    requestCount: number,
    errorCount: number
  ): Promise<void> {
    await recordErrorMetrics(projectId, requestCount, errorCount)
  }

  /**
   * Get error rate detection history for a project
   */
  static async getHistory(
    projectId: string,
    hours?: number
  ): Promise<ErrorRateDetectionResult[]> {
    return getErrorRateDetectionHistory(projectId, hours)
  }

  /**
   * Get error rate detection configuration
   */
  static async getConfig(): Promise<{
    thresholdPercentage: number
    detectionWindowMs: number
    minRequestsForDetection: number
    actionThresholds: Array<{ minErrorRate: number; action: string }>
  }> {
    return getErrorRateDetectionConfig()
  }

  /**
   * Get error rate detection summary across all projects
   */
  static async getSummary(): Promise<{
    totalProjects: number
    activeDetections: number
    recentInvestigations: number
    bySeverity: Record<string, number>
  }> {
    return getErrorRateDetectionSummary()
  }

  /**
   * Check a specific project's current error rate status
   */
  static async checkCurrentStatus(projectId: string): Promise<ErrorRateDetectionResult | null> {
    return checkProjectErrorRateStatus(projectId)
  }
}

/**
 * Pattern Detection Manager - Main interface for malicious pattern detection operations
 */
export class PatternDetectionManager {
  /**
   * Check a single project for all malicious patterns
   */
  static async checkProject(projectId: string): Promise<PatternDetectionResult[]> {
    return checkProjectForMaliciousPatterns(projectId)
  }

  /**
   * Check all projects for malicious patterns
   */
  static async checkAllProjects(): Promise<PatternDetectionResult[]> {
    return checkAllProjectsForMaliciousPatterns()
  }

  /**
   * Run the pattern detection background job
   */
  static async runBackgroundJob(): Promise<PatternDetectionJobResult> {
    return runPatternDetection()
  }

  /**
   * Get pattern detection configuration
   */
  static async getConfig(): Promise<{
    sql_injection: {
      enabled: boolean
      min_occurrences: number
      detection_window_ms: number
      suspend_on_detection: boolean
    }
    auth_brute_force: {
      enabled: boolean
      min_failed_attempts: number
      detection_window_ms: number
      suspend_on_detection: boolean
    }
    rapid_key_creation: {
      enabled: boolean
      min_keys_created: number
      detection_window_ms: number
      suspend_on_detection: boolean
    }
  }> {
    return getPatternDetectionConfig()
  }

  /**
   * Get pattern detection history for a project
   */
  static async getHistory(
    projectId: string,
    hours: number = 24
  ): Promise<PatternDetectionResult[]> {
    const now = new Date()
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)

    const result = await getPatternDetections(projectId, startTime, now)

    if (!result.success || !result.data) {
      return []
    }

    return result.data.map((row) => ({
      project_id: row.project_id,
      pattern_type: row.pattern_type as any,
      severity: row.severity as any,
      occurrence_count: row.occurrence_count,
      detection_window_ms: row.detection_window_ms,
      detected_at: row.detected_at,
      description: row.description,
      evidence: row.evidence || undefined,
      action_taken: row.action_taken as any,
    }))
  }

  /**
   * Get pattern detection statistics for a project
   */
  static async getStatistics(
    projectId: string,
    hours: number = 24
  ): Promise<{
    total_detections: number
    by_pattern_type: {
      sql_injection: number
      auth_brute_force: number
      rapid_key_creation: number
    }
    by_severity: { warning: number; critical: number; severe: number }
    by_action: { none: number; warning: number; suspension: number }
  } | null> {
    const now = new Date()
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000)

    const result = await getPatternDetectionStatistics(projectId, startTime, now)

    if (!result.success || !result.data) {
      return null
    }

    return result.data
  }

  /**
   * Record a pattern detection result
   */
  static async recordDetection(
    projectId: string,
    patternType: string,
    severity: string,
    occurrenceCount: number,
    detectionWindowMs: number,
    description: string,
    evidence: string[] | undefined,
    actionTaken: string
  ): Promise<boolean> {
    const result = await logPatternDetection(
      projectId,
      patternType,
      severity,
      occurrenceCount,
      detectionWindowMs,
      description,
      evidence,
      actionTaken
    )

    return result.success
  }

  /**
   * Get pattern detection summary across all projects
   */
  static async getSummary(): Promise<{
    total_projects: number
    active_detections: number
    recent_suspensions: number
    by_pattern_type: {
      sql_injection: number
      auth_brute_force: number
      rapid_key_creation: number
    }
    by_severity: Record<string, number>
  }> {
    return getPatternDetectionSummary()
  }

  /**
   * Check a specific project's current pattern status
   */
  static async checkCurrentStatus(projectId: string): Promise<PatternDetectionResult[]> {
    return checkProjectForMaliciousPatterns(projectId)
  }

  /**
   * Get project's pattern detection configuration from database
   */
  static async getProjectConfig(projectId: string): Promise<{
    success: boolean
    data: {
      id: string
      project_id: string
      sql_injection_enabled: boolean
      sql_injection_min_occurrences: number
      sql_injection_window_ms: number
      sql_injection_suspend_on_detection: boolean
      auth_brute_force_enabled: boolean
      auth_brute_force_min_attempts: number
      auth_brute_force_window_ms: number
      auth_brute_force_suspend_on_detection: boolean
      rapid_key_creation_enabled: boolean
      rapid_key_creation_min_keys: number
      rapid_key_creation_window_ms: number
      rapid_key_creation_suspend_on_detection: boolean
      enabled: boolean
      created_at: Date
      updated_at: Date
    } | null
    error?: unknown
  }> {
    return getPatternDetectionConfigFromDb(projectId)
  }
}

/**
 * Notification Manager - Main interface for notification operations
 */
export class NotificationManager {
  /**
   * Send suspension notification to project stakeholders
   */
  static async sendSuspensionNotification(
    projectId: string,
    projectName: string,
    orgName: string,
    reason: SuspensionReason,
    suspendedAt: Date
  ): Promise<NotificationDeliveryResult[]> {
    return sendSuspensionNotification(projectId, projectName, orgName, reason, suspendedAt)
  }

  /**
   * Get notification recipients for a project
   */
  static async getRecipients(projectId: string): Promise<NotificationRecipient[]> {
    return getNotificationRecipients(projectId)
  }

  /**
   * Create suspension notification template
   */
  static createSuspensionTemplate(
    projectName: string,
    orgName: string,
    reason: SuspensionReason,
    suspendedAt: Date
  ) {
    return createSuspensionNotificationTemplate(projectName, orgName, reason, suspendedAt)
  }

  /**
   * Format suspension notification email
   */
  static formatSuspensionEmail(template: ReturnType<typeof createSuspensionNotificationTemplate>) {
    return formatSuspensionNotificationEmail(template)
  }

  /**
   * Create a notification record
   */
  static async create(
    projectId: string,
    type: string,
    priority: string,
    subject: string,
    body: string,
    data: Record<string, unknown>,
    channels: string[]
  ): Promise<string> {
    return createNotification(
      projectId,
      type as any,
      priority as any,
      subject,
      body,
      data,
      channels as any[]
    )
  }

  /**
   * Get notification by ID
   */
  static async get(notificationId: string): Promise<Notification | null> {
    return getNotification(notificationId)
  }

  /**
   * Get notifications for a project
   */
  static async getProjectNotifications(projectId: string, limit?: number): Promise<Notification[]> {
    return getProjectNotifications(projectId, limit)
  }

  /**
   * Retry failed notifications
   */
  static async retryFailed(maxAttempts?: number): Promise<number> {
    return retryFailedNotifications(maxAttempts)
  }
}

/**
 * Notification Preferences Manager - Manages user notification preferences
 */
export class NotificationPreferencesManager {
  /**
   * Get all notification preferences for a user
   */
  static async getAll(userId: string, projectId?: string) {
    return getNotificationPreferences(userId, projectId)
  }

  /**
   * Get a specific notification preference
   */
  static async get(userId: string, notificationType: string, projectId?: string) {
    return getNotificationPreference(userId, notificationType as any, projectId)
  }

  /**
   * Create or update a notification preference
   */
  static async set(
    userId: string,
    notificationType: string,
    enabled: boolean,
    channels: string[],
    projectId?: string
  ): Promise<string> {
    return upsertNotificationPreference(userId, notificationType as any, enabled, channels as any[], projectId)
  }

  /**
   * Set multiple preferences at once
   */
  static async setMany(userId: string, preferences: Array<{
    notification_type: string
    enabled: boolean
    channels: string[]
  }>, projectId?: string): Promise<string[]> {
    const ids: string[] = []

    for (const preference of preferences) {
      const id = await upsertNotificationPreference(
        userId,
        preference.notification_type as any,
        preference.enabled,
        preference.channels as any[],
        projectId
      )
      ids.push(id)
    }

    return ids
  }

  /**
   * Delete a notification preference
   */
  static async delete(userId: string, notificationType: string, projectId?: string): Promise<boolean> {
    return deleteNotificationPreference(userId, notificationType as any, projectId)
  }

  /**
   * Check if user should receive notification
   */
  static async shouldReceive(userId: string, notificationType: string, projectId?: string): Promise<boolean> {
    return shouldReceiveNotification(userId, notificationType as any, projectId)
  }

  /**
   * Get enabled channels for a notification type
   */
  static async getChannels(userId: string, notificationType: string, projectId?: string) {
    return getEnabledChannels(userId, notificationType as any, projectId)
  }

  /**
   * Apply default preferences for a new user
   */
  static async applyDefaults(userId: string): Promise<boolean> {
    return applyDefaultNotificationPreferences(userId)
  }

  /**
   * Get default preferences template
   */
  static getDefaults() {
    return getDefaultNotificationPreferences()
  }
}

/**
 * Override Manager - Main interface for manual override operations
 */
export class OverrideManager {
  /**
   * Perform a manual override on a project
   *
   * @param request - The override request
   * @param performedBy - User ID of the performer
   * @param ipAddress - Optional IP address of the performer
   * @returns Result of the override operation
   */
  static async perform(
    request: ManualOverrideRequest,
    performedBy: string,
    ipAddress?: string
  ): Promise<ManualOverrideResult> {
    return performManualOverride(request, performedBy, ipAddress)
  }

  /**
   * Validate an override request
   *
   * @param request - The override request to validate
   * @returns Validation result
   */
  static async validate(
    request: ManualOverrideRequest
  ): Promise<{ valid: boolean; error?: string }> {
    return validateManualOverrideRequest(request)
  }

  /**
   * Get override history for a project
   *
   * @param projectId - The project to get history for
   * @param limit - Maximum number of records to return
   * @returns Array of override records
   */
  static async getHistory(
    projectId: string,
    limit: number = 50
  ): Promise<OverrideRecord[]> {
    return getOverrideHistory(projectId, limit)
  }

  /**
   * Get overrides for a specific project (alias for getHistory)
   *
   * @param projectId - The project to get overrides for
   * @param limit - Maximum number of records to return
   * @returns Array of override records
   */
  static async getByProject(
    projectId: string,
    limit: number = 50
  ): Promise<OverrideRecord[]> {
    return getOverrideHistory(projectId, limit)
  }

  /**
   * Get all overrides across all projects (admin only)
   *
   * @param limit - Maximum number of records to return
   * @param offset - Number of records to skip
   * @returns Array of override records
   */
  static async getAll(
    limit: number = 100,
    offset: number = 0
  ): Promise<OverrideRecord[]> {
    return getAllOverrides(limit, offset)
  }

  /**
   * Get a specific override by ID
   *
   * @param overrideId - The override ID
   * @returns The override record or null if not found
   */
  static async getById(overrideId: string): Promise<OverrideRecord | null> {
    return getOverrideById(overrideId)
  }

  /**
   * Get override statistics
   *
   * @returns Statistics about overrides
   */
  static async getStatistics(): Promise<{
    total: number
    byAction: Record<string, number>
    recentCount: number
  }> {
    return getOverrideStatistics()
  }
}
