'use client';

import { motion } from 'framer-motion';
import { Database, Radio, Zap, CheckCircle2 } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const concepts = [
  {
    icon: Database,
    title: 'DB-Driven Realtime',
    description: 'Subscriptions follow your database table structure',
    details: [
      'Subscribe to any table: users, orders, messages',
      'Filters use SQL WHERE clauses',
      'Schema-driven: no custom protocol needed',
      'Works with existing database constraints'
    ]
  },
  {
    icon: Radio,
    title: 'Change Data Capture (CDC)',
    description: 'Postgres logical replication feeds',
    details: [
      'Captures INSERT, UPDATE, DELETE operations',
      'Real-time streaming via logical replication',
      'Efficient: only changed data transmitted',
      'Ordered delivery guarantees'
    ]
  },
  {
    icon: Zap,
    title: 'WebSocket Transport',
    description: 'Persistent connections for instant updates',
    details: [
      'Automatic reconnection with exponential backoff',
      'Heartbeat/ping for connection health',
      'Binary message format for efficiency',
      'Browser and Node.js clients supported'
    ]
  }
];

export function RealtimeConcepts() {
  return (
    <motion.div variants={itemVariants} className="mb-16">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">How It Works</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {concepts.map((concept, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 hover:border-emerald-500/50 transition-colors"
          >
            <concept.icon className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">{concept.title}</h3>
            <p className="text-slate-400 mb-4">{concept.description}</p>
            <ul className="space-y-2">
              {concept.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
