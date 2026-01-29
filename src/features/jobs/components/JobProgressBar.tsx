'use client';

import { motion } from 'framer-motion';
import type { JobStatus } from '@/lib/types/job.types';
import type { JobProgressInfo } from '../utils/job-progress.utils';
import { getStatusColor, getProgressColor } from '../utils/job-progress.utils';

interface JobProgressBarProps {
  status: JobStatus;
  progress: JobProgressInfo;
}

export function JobProgressBar({ status, progress }: JobProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{progress.currentStage}</span>
        <span className={`font-semibold ${getStatusColor(status)}`}>
          {Math.round(progress.percentage)}%
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 0.3 }}
          className={`h-full ${getProgressColor(status)}`}
        />
      </div>
    </div>
  );
}
