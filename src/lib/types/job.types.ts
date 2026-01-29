/**
 * Job Types
 *
 * Type definitions for job status and progress tracking.
 * These types define the structures for monitoring background jobs.
 */

/**
 * Job status enum
 */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Job status response from API
 */
export interface JobStatusResponse {
  id: string;
  type: string;
  status: JobStatus;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/**
 * Job status API response wrapper
 */
export interface JobStatusApiResponse {
  data: JobStatusResponse;
}

/**
 * Job retry response from API
 */
export interface JobRetryResponse {
  id: string;
  type: string;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  scheduled_at: string;
  created_at: string;
}

/**
 * Job retry API response wrapper
 */
export interface JobRetryApiResponse {
  data: JobRetryResponse;
}

/**
 * Provision project job stages (for multi-step progress tracking)
 */
export enum ProvisionProjectStage {
  INITIALIZING = 'initializing',
  CREATING_DATABASE = 'creating_database',
  CREATING_SCHEMA = 'creating_schema',
  REGISTERING_AUTH = 'registering_auth',
  REGISTERING_REALTIME = 'registering_realtime',
  REGISTERING_STORAGE = 'registering_storage',
  GENERATING_API_KEYS = 'generating_api_keys',
  FINALIZING = 'finalizing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Job progress calculation result
 */
export interface JobProgress {
  percentage: number;
  currentStage: string;
  totalStages: number;
  currentStageIndex: number;
}

/**
 * Job error information
 */
export interface JobError {
  message: string;
  timestamp: string;
}
