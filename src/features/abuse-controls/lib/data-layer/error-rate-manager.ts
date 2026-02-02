/**
 * Error Rate Detection Manager - Main interface for error rate detection operations
 */

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
} from '../error-rate-detection'
import type { ErrorRateDetectionResult, ErrorRateDetectionJobResult } from '../../types'

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
