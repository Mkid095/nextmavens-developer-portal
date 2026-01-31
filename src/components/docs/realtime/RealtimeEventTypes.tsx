'use client';

import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const eventTypes = [
  { event: 'INSERT', description: 'New row created', payload: '{ new: {...} }', color: 'emerald' },
  { event: 'UPDATE', description: 'Row modified', payload: '{ old: {...}, new: {...} }', color: 'blue' },
  { event: 'DELETE', description: 'Row removed', payload: '{ old: {...} }', color: 'red' },
  { event: 'TRUNCATE', description: 'All rows removed (table truncated)', payload: '""', color: 'orange' },
  { event: '*', description: 'All events', payload: 'Varies by event', color: 'purple' },
];

export function RealtimeEventTypes() {
  return (
    <motion.div variants={itemVariants} className="mb-16">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Event Types</h2>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">Event</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">Description</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {eventTypes.map((type) => (
              <tr key={type.event} className="hover:bg-slate-700/30">
                <td className="px-6 py-4">
                  <code className={`text-${type.color}-400`}>{type.event}</code>
                </td>
                <td className="px-6 py-4 text-slate-300">{type.description}</td>
                <td className="px-6 py-4">
                  <code className="text-sm text-slate-400">{type.payload}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
