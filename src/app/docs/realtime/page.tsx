'use client';

import { motion } from 'framer-motion';
import {
  RealtimeHeader,
  RealtimeOverview,
  RealtimeConcepts,
  RealtimeLimits,
  RealtimeWebSocket,
  RealtimeSubscriptions,
  RealtimeChannelPrefixing,
  RealtimeUsageExamples,
  RealtimeEventTypes,
  RealtimeConnectionLifecycle,
} from '@/components/docs/realtime';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function RealtimeDocs() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    >
      <RealtimeHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <RealtimeOverview />
        <RealtimeConcepts />
        <RealtimeLimits />
        <RealtimeWebSocket />
        <RealtimeSubscriptions />
        <RealtimeChannelPrefixing />
        <RealtimeUsageExamples />
        <RealtimeEventTypes />
        <RealtimeConnectionLifecycle />
      </div>
    </motion.div>
  );
}
