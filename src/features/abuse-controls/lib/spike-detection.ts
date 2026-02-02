/**
 * Spike Detection Library
 *
 * Detects usage spikes that may indicate abuse or anomalous behavior.
 * Calculates average usage over a baseline period and compares against current usage.
 *
 * Usage:
 * - Call runSpikeDetection() from a background job (e.g., every hour)
 * - The function will check all projects for usage spikes
 * - Actions are taken based on spike severity (warning or suspension)
 *
 * This module has been refactored into smaller, focused modules:
 * - spike-detection/types.ts - Type definitions
 * - spike-detection/usage-calculator.ts - Usage calculation functions
 * - spike-detection/spike-detector.ts - Spike detection functions
 * - spike-detection/spike-checker.ts - Project checking functions
 * - spike-detection/spike-actions.ts - Action triggering functions
 * - spike-detection/spike-detection-job.ts - Main background job
 * - spike-detection/metrics-recorder.ts - Metrics recording functions
 * - spike-detection/spike-status.ts - Status and history functions
 */

// Re-export all spike detection functions from submodules
export {
  calculateAverageUsage,
  detectUsageSpike,
  checkProjectForSpikes,
  checkAllProjectsForSpikes,
  triggerSpikeAction,
  runSpikeDetection,
  recordUsageMetric,
  recordUsageMetrics,
  getSpikeDetectionConfig,
  getSpikeDetectionHistory,
  checkProjectSpikeStatus,
  getSpikeDetectionSummary,
} from './spike-detection/index'

// Re-export the job result type
export type { SpikeDetectionJobResult } from './spike-detection/types'
