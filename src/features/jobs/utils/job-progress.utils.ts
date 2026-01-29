/**
 * Job Progress Utilities
 * Helper functions for calculating and displaying job progress
 */

import type { JobStatus, JobStatusResponse } from '@/lib/types/job.types';
import { ProvisionProjectStage } from '@/lib/types/job.types';

/**
 * Job progress calculation result
 */
export interface JobProgressInfo {
  percentage: number;
  currentStage: string;
  totalStages: number;
}

/**
 * Calculate progress percentage for multi-step jobs
 */
export function calculateJobProgress(job: JobStatusResponse): JobProgressInfo {
  // For provision_project job, use stages
  if (job.type === 'provision_project') {
    const stages = Object.values(ProvisionProjectStage).filter(
      (stage) => stage !== ProvisionProjectStage.FAILED
    );

    const stageFromPayload = job.payload.stage as string | undefined;
    let currentStageIndex = 0;

    if (stageFromPayload) {
      currentStageIndex = stages.findIndex((s) => s === stageFromPayload);
      if (currentStageIndex === -1) {
        currentStageIndex = 0;
      }
    }

    // If completed, show 100%
    if (job.status === 'completed') {
      return {
        percentage: 100,
        currentStage: 'Completed',
        totalStages: stages.length,
      };
    }

    // If failed, show partial progress
    if (job.status === 'failed') {
      return {
        percentage: Math.max(0, (currentStageIndex / stages.length) * 100),
        currentStage: stageFromPayload || 'Failed',
        totalStages: stages.length,
      };
    }

    return {
      percentage: (currentStageIndex / stages.length) * 100,
      currentStage: stageFromPayload || 'Initializing',
      totalStages: stages.length,
    };
  }

  // For other job types, use status-based progress
  if (job.status === 'completed') {
    return { percentage: 100, currentStage: 'Completed', totalStages: 1 };
  }
  if (job.status === 'running') {
    return { percentage: 50, currentStage: 'Processing', totalStages: 1 };
  }
  if (job.status === 'failed') {
    return { percentage: 0, currentStage: 'Failed', totalStages: 1 };
  }

  return { percentage: 0, currentStage: 'Pending', totalStages: 1 };
}

/**
 * Format stage name for display
 */
export function formatStageName(stage: string): string {
  return stage
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Estimate time remaining based on job progress
 */
export function estimateTimeRemaining(job: JobStatusResponse): string {
  if (!job.started_at || job.status !== 'running') {
    return 'Calculating...';
  }

  const started = new Date(job.started_at).getTime();
  const now = Date.now();
  const elapsed = now - started;

  // For provision_project, estimate based on stages
  if (job.type === 'provision_project') {
    const progress = calculateJobProgress(job);
    if (progress.percentage > 0) {
      const totalEstimated = (elapsed / progress.percentage) * 100;
      const remaining = totalEstimated - elapsed;

      if (remaining < 60000) {
        return `${Math.ceil(remaining / 1000)}s remaining`;
      }
      return `${Math.ceil(remaining / 60000)}m remaining`;
    }
  }

  // Default estimate for other job types
  if (elapsed < 30000) {
    return '< 1m remaining';
  }
  if (elapsed < 120000) {
    return '~2m remaining';
  }
  return 'Calculating...';
}

/**
 * Get status color class
 */
export function getStatusColor(status: JobStatus): string {
  switch (status) {
    case 'pending':
      return 'text-slate-600';
    case 'running':
      return 'text-blue-600';
    case 'completed':
      return 'text-emerald-600';
    case 'failed':
      return 'text-red-600';
    default:
      return 'text-slate-600';
  }
}

/**
 * Get status background color class
 */
export function getStatusBgColor(status: JobStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-slate-100 text-slate-700';
    case 'running':
      return 'bg-blue-100 text-blue-700';
    case 'completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

/**
 * Get progress bar color class
 */
export function getProgressColor(status: JobStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-slate-300';
    case 'running':
      return 'bg-blue-600';
    case 'completed':
      return 'bg-emerald-600';
    case 'failed':
      return 'bg-red-600';
    default:
      return 'bg-slate-300';
  }
}
