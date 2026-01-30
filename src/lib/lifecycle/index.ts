/**
 * Project Lifecycle Module
 *
 * PRD: US-010 - Implement Auto-Status Transitions
 *
 * This module provides automated status transition functionality for projects.
 *
 * Exports:
 * - runAutoStatusTransitionsJob: Main background job for all status transitions
 * - getStatusTransitionSummary: Summary of recent transition activity
 */

export {
  runAutoStatusTransitionsJob,
  getStatusTransitionSummary,
} from './background-jobs'

export type { AutoStatusTransitionsJobResult } from './background-jobs'
