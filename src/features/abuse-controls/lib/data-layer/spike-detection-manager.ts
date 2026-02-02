/**
 * Spike Detection Manager - Main interface for spike detection operations
 */

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
} from '../spike-detection'
import { HardCapType } from '../../types'
import type { SpikeDetectionResult, SpikeDetectionJobResult } from '../../types'

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
