/**
 * Spike Detection Library
 * Re-exports all spike detection modules
 */

// Types
export type { SpikeDetectionJobResult } from './types'

// Usage Calculator
export { calculateAverageUsage } from './usage-calculator'

// Spike Detector
export { detectUsageSpike } from './spike-detector'

// Spike Checker
export { checkProjectForSpikes, checkAllProjectsForSpikes } from './spike-checker'

// Spike Actions
export { triggerSpikeAction } from './spike-actions'

// Spike Detection Job
export { runSpikeDetection } from './spike-detection-job'

// Metrics Recorder
export { recordUsageMetric, recordUsageMetrics } from './metrics-recorder'

// Status and Configuration
export {
  getSpikeDetectionConfig,
  getSpikeDetectionHistory,
  checkProjectSpikeStatus,
  getSpikeDetectionSummary,
} from './spike-status'
