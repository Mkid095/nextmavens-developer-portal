'use client';

import type { JobStatusResponse } from '@/lib/types/job.types';

interface JobProgressTimestampsProps {
  job: JobStatusResponse;
}

export function JobProgressTimestamps({ job }: JobProgressTimestampsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
      <div>
        <p className="font-medium text-slate-700">Created</p>
        <p>{new Date(job.created_at).toLocaleString()}</p>
      </div>
      <div>
        <p className="font-medium text-slate-700">Started</p>
        <p>{job.started_at ? new Date(job.started_at).toLocaleString() : 'Not started'}</p>
      </div>
      <div>
        <p className="font-medium text-slate-700">Completed</p>
        <p>{job.completed_at ? new Date(job.completed_at).toLocaleString() : 'In progress'}</p>
      </div>
    </div>
  );
}
