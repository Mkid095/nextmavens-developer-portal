'use client';

import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function RealtimeOverview() {
  return (
    <motion.div variants={itemVariants} className="mb-16">
      <h2 className="text-2xl font-bold text-slate-100 mb-4">Overview</h2>
      <div className="prose prose-invert max-w-none">
        <p className="text-slate-300 text-lg leading-relaxed mb-4">
          NextMavens Realtime provides live data updates through database-driven subscriptions.
          Unlike traditional realtime services that require custom protocols, our approach follows
          your database structure—making it intuitive and powerful.
        </p>
        <p className="text-slate-300 text-lg leading-relaxed">
          Using Postgres logical replication (CDC), we capture data changes at the database level
          and broadcast them to subscribed clients via WebSocket connections. This ensures
          reliable, ordered delivery with minimal overhead.
        </p>
      </div>
    </motion.div>
  );
}
