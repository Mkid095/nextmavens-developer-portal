'use client';

import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import type { JobStatus } from '@/lib/types/job.types';
import { formatStageName, getStatusBgColor } from '../utils/job-progress.utils';

interface JobProgressHeaderProps {
  jobType: string;
  jobId: string;
  status: JobStatus;
}

export function JobProgressHeader({
  jobType,
  jobId,
  status,
}: JobProgressHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {status === 'running' && (
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        )}
        {status === 'completed' && (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        )}
        {status === 'failed' && (
          <XCircle className="w-5 h-5 text-red-600" />
        )}
        {status === 'pending' && (
          <Clock className="w-5 h-5 text-slate-400" />
        )}
        <div>
          <h3 className="font-semibold text-slate-900">
            {formatStageName(jobType)}
          </h3>
          <p className="text-sm text-slate-500">
            Job ID: {jobId.slice(0, 8)}...
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBgColor(status)}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    </div>
  );
}
