/**
 * Jobs API Client
 * Client for interacting with the jobs API for status monitoring and retry
 */

import type {
  JobStatusResponse,
  JobStatusApiResponse,
  JobRetryResponse,
  JobRetryApiResponse,
} from '@/lib/types/job.types';

/**
 * Jobs API configuration
 */
interface JobsApiConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * Jobs API client
 */
export class JobsApiClient {
  private config: JobsApiConfig;

  constructor(config: JobsApiConfig) {
    this.config = config;
  }

  /**
   * Make an authenticated request to the jobs API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: 'Unknown error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new JobsApiClientError(error.message || 'Unknown error', error);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof JobsApiClientError) {
        throw error;
      }
      throw new JobsApiClientError(
        'Failed to connect to jobs API',
        {
          error: 'NetworkError',
          message: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await this.request<JobStatusApiResponse>(`/api/jobs/${jobId}`);
    return response.data;
  }

  /**
   * Retry a failed job by ID
   */
  async retryJob(jobId: string): Promise<JobRetryResponse> {
    const response = await this.request<JobRetryApiResponse>(`/api/jobs/${jobId}/retry`, {
      method: 'POST',
    });
    return response.data;
  }
}

/**
 * Custom error class for jobs API client errors
 */
export class JobsApiClientError extends Error {
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, errorResponse: Record<string, unknown>) {
    super(message);
    this.name = 'JobsApiClientError';
    this.code = errorResponse.code as string | undefined;
    this.details = errorResponse.details as Record<string, unknown> | undefined;
  }
}

/**
 * Create a singleton jobs API client instance
 * Reads configuration from environment variables
 */
export function createJobsApiClient(): JobsApiClient {
  const baseUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';
  const apiKey = process.env.API_GATEWAY_API_KEY || '';

  if (!apiKey) {
    throw new Error('API_GATEWAY_API_KEY environment variable is required');
  }

  return new JobsApiClient({ baseUrl, apiKey });
}

/**
 * Get or create the default jobs API client instance
 * Returns undefined if API_GATEWAY_API_KEY is not set
 */
export function getJobsApiClient(): JobsApiClient | undefined {
  return jobsApiClient;
}

/**
 * Default jobs API client instance (lazy, may be undefined)
 */
let jobsApiClient: JobsApiClient | undefined = undefined;

try {
  jobsApiClient = createJobsApiClient();
} catch {
  // API_GATEWAY_API_KEY not set, client will be undefined
}
