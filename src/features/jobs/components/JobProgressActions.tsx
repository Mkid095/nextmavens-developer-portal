'use client';

import { RefreshCw } from 'lucide-react';
import type { JobStatusResponse } from '@/lib/types/job.types';

interface JobProgressActionsProps {
  job: JobStatusResponse;
  onRetry: () => void;
  retrying: boolean;
}

export function JobProgressActions({ job, onRetry, retrying }: JobProgressActionsProps) {
  const canRetry = job.status === 'failed' && job.attempts < job.max_attempts;

  if (canRetry) {
    return (
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-slate-600">
          Attempt {job.attempts} of {job.max_attempts}
        </p>
        <button
          onClick={onRetry}
          disabled={retrying}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Retrying...' : 'Retry Job'}
        </button>
      </div>
    );
  }

  if (job.status === 'failed' && !canRetry) {
    return (
      <p className="text-sm text-red-600">
        Maximum retry attempts ({job.max_attempts}) reached
      </p>
    );
  }

  return null;
}
