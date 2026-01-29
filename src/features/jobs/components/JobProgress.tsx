'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Clock } from 'lucide-react';
import type { JobStatus, JobStatusResponse } from '@/lib/types/job.types';
import { getJobsApiClient, JobsApiClientError } from '@/lib/api/jobs-client';
import { calculateJobProgress, estimateTimeRemaining } from '../utils/job-progress.utils';
import { JobProgressHeader } from './JobProgressHeader';
import { JobProgressBar } from './JobProgressBar';
import { JobProgressActions } from './JobProgressActions';
import { JobProgressTimestamps } from './JobProgressTimestamps';

interface JobProgressProps {
  jobId: string;
  onComplete?: (job: JobStatusResponse) => void;
  onFailure?: (job: JobStatusResponse) => void;
  pollInterval?: number;
  className?: string;
}

export function JobProgress({
  jobId,
  onComplete,
  onFailure,
  pollInterval = 2000,
  className = '',
}: JobProgressProps) {
  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchJobStatus = useCallback(async () => {
    try {
      const client = getJobsApiClient();
      if (!client) {
        throw new Error('Jobs API client not configured');
      }

      const jobStatus = await client.getJobStatus(jobId);
      setJob(jobStatus);
      setError(null);

      // Trigger callbacks
      if (jobStatus.status === 'completed' && onComplete) {
        onComplete(jobStatus);
      }
      if (jobStatus.status === 'failed' && onFailure) {
        onFailure(jobStatus);
      }
    } catch (err) {
      console.error('Failed to fetch job status:', err);
      if (err instanceof JobsApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to load job status');
      }
    } finally {
      setLoading(false);
    }
  }, [jobId, onComplete, onFailure]);

  const handleRetry = async () => {
    if (!job || job.attempts >= job.max_attempts) {
      return;
    }

    setRetrying(true);
    setError(null);

    try {
      const client = getJobsApiClient();
      if (!client) {
        throw new Error('Jobs API client not configured');
      }

      await client.retryJob(jobId);
      await fetchJobStatus();
    } catch (err) {
      console.error('Failed to retry job:', err);
      if (err instanceof JobsApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to retry job');
      }
    } finally {
      setRetrying(false);
    }
  };

  // Auto-refresh job status
  useEffect(() => {
    fetchJobStatus();

    // Only poll if job is pending or running
    if (job && (job.status === 'pending' || job.status === 'running')) {
      const interval = setInterval(fetchJobStatus, pollInterval);
      return () => clearInterval(interval);
    }
  }, [jobId, job?.status, pollInterval, fetchJobStatus]);

  // Render loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
            <span className="text-slate-600">Loading job status...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !job) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error loading job status</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const progress = calculateJobProgress(job);
  const showProgressBar =
    job.status === 'running' || job.status === 'completed' || job.status === 'failed';

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      {/* Header */}
      <JobProgressHeader jobType={job.type} jobId={job.id} status={job.status} />

      {/* Progress Section */}
      <div className="px-6 py-4 space-y-4">
        {/* Progress Bar */}
        {showProgressBar && <JobProgressBar status={job.status} progress={progress} />}

        {/* Time Remaining (only for running jobs) */}
        {job.status === 'running' && job.started_at && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            <span>{estimateTimeRemaining(job)}</span>
          </div>
        )}

        {/* Error Message */}
        {job.status === 'failed' && job.last_error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-900">Job Failed</p>
                <p className="text-sm text-red-700 mt-1">{job.last_error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Retry Actions */}
        <JobProgressActions job={job} onRetry={handleRetry} retrying={retrying} />

        {/* Timestamps */}
        <JobProgressTimestamps job={job} />
      </div>
    </div>
  );
}
