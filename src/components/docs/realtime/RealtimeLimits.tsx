'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const limits = [
  {
    name: 'Connections per Project',
    value: '50',
    unit: 'connections',
    description: 'Maximum concurrent WebSocket connections per project',
    color: 'emerald'
  },
  {
    name: 'Message Rate',
    value: '100',
    unit: 'messages/second',
    description: 'Maximum message broadcast rate per project',
    color: 'blue'
  },
  {
    name: 'Payload Size',
    value: '64KB',
    unit: 'per message',
    description: 'Maximum size for any realtime message',
    color: 'purple'
  },
  {
    name: 'Subscription Depth',
    value: '10',
    unit: 'tables',
    description: 'Maximum simultaneous table subscriptions per connection',
    color: 'orange'
  }
];

export function RealtimeLimits() {
  return (
    <motion.div variants={itemVariants} className="mb-16">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Limits & Quotas</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {limits.map((limit, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">{limit.name}</span>
              <Shield className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-3xl font-bold text-${limit.color}-400`}>
                {limit.value}
              </span>
              <span className="text-sm text-slate-400">{limit.unit}</span>
            </div>
            <p className="text-xs text-slate-500">{limit.description}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-300">
          <strong>Need higher limits?</strong> Contact support to discuss your requirements.
          Custom limits are available for enterprise plans.
        </p>
      </div>
    </motion.div>
  );
}
