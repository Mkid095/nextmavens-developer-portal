'use client';

import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const examples = [
  {
    title: 'Subscribe to Table Changes',
    code: `const { subscribe } = createClient();

const subscription = subscribe({
  channel: 'users',
  event: '*',
  schema: 'public',
  filter: 'status = active'
});

subscription.on('update', (payload) => {
  console.log('User updated:', payload.new);
});`
  },
  {
    title: 'Filter with SQL WHERE',
    code: `// Only receive updates for specific user
subscribe({
  channel: 'orders',
  event: 'INSERT',
  schema: 'public',
  filter: 'user_id = eq.123'
});

// Complex filter with multiple conditions
subscribe({
  channel: 'messages',
  event: '*',
  schema: 'public',
  filter: 'room_id = eq.456 AND created_at > gte.2024-01-01'
});`
  },
  {
    title: 'Handle Different Events',
    code: `const channel = subscribe({
  channel: 'products',
  event: '*',
  schema: 'public'
});

channel.on('INSERT', (payload) => {
  console.log('New product:', payload.new);
});

channel.on('UPDATE', (payload) => {
  console.log('Product changed:', {
    old: payload.old,
    new: payload.new
  });
});

channel.on('DELETE', (payload) => {
  console.log('Product removed:', payload.old);
});`
  }
];

export function RealtimeUsageExamples() {
  return (
    <motion.div variants={itemVariants} className="mb-16">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Usage Examples</h2>
      <div className="space-y-6">
        {examples.map((example, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-700/50">
              <h3 className="text-lg font-semibold text-slate-100">{example.title}</h3>
            </div>
            <pre className="p-6 overflow-x-auto">
              <code className="text-sm text-slate-300">{example.code}</code>
            </pre>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
