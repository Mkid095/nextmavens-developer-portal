'use client';

import { motion } from 'framer-motion';
import { Radio, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function RealtimeSubscriptions() {
  return (
    <motion.div variants={itemVariants} className="mb-16">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Subscriptions</h2>

      <div className="prose prose-invert max-w-none mb-8">
        <p className="text-slate-300 text-lg leading-relaxed mb-4">
          Subscribe to real-time data changes using the Phoenix-style subscription protocol.
          Channels follow the format <code className="text-emerald-400">realtime:table_name</code> and
          support SQL-based filtering for precise data targeting.
        </p>
      </div>

      {/* Channel Format */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Radio className="w-5 h-5 text-emerald-400" />
          Channel Format
        </h3>
        <pre className="bg-slate-900 rounded-lg p-4 mb-4">
          <code className="text-sm text-slate-300">realtime:table_name</code>
        </pre>
        <p className="text-sm text-slate-400 mb-3">
          Replace <code className="text-emerald-400">table_name</code> with your actual table name.
          Use the schema prefix for custom schemas: <code className="text-emerald-400">schema:table_name</code>
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <p className="text-sm text-emerald-300 mb-1">✓ Valid</p>
            <code className="text-xs text-emerald-200">realtime:users</code>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <p className="text-sm text-emerald-300 mb-1">✓ Valid (with schema)</p>
            <code className="text-xs text-emerald-200">realtime:public.products</code>
          </div>
        </div>
      </div>

      {/* Subscribe Example */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Subscribe to Changes
        </h3>
        <pre className="bg-slate-900 rounded-lg p-4">
          <code className="text-sm text-slate-300">{`// Join a channel to receive updates
const subscribe = {
  event: 'phx_join',
  topic: 'realtime:users',
  payload: {
    token: 'YOUR_JWT_TOKEN',
    config: {
      // Listen only to INSERT events
      events: ['INSERT'],

      // Apply SQL WHERE filter
      filter: 'status = active AND created_at > NOW() - INTERVAL \\'7 days\\''
    }
  },
  ref: '1'
};

ws.send(JSON.stringify(subscribe));

// Listen for join confirmation
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.event === 'phx_reply' && msg.ref === '1') {
    if (msg.payload.status === 'ok') {
      console.log('Successfully subscribed!');
    }
  }

  // Handle INSERT events
  if (msg.event === 'INSERT') {
    console.log('New user:', msg.payload.new);
  }
};`}</code>
        </pre>
      </div>

      {/* Filter Examples */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Filter Examples</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-300 mb-2">Equality filter:</p>
            <pre className="bg-slate-900 rounded-lg p-3">
              <code className="text-xs text-slate-300">user_id = eq.123</code>
            </pre>
          </div>
          <div>
            <p className="text-sm text-slate-300 mb-2">Inequality:</p>
            <pre className="bg-slate-900 rounded-lg p-3">
              <code className="text-xs text-slate-300">status != eq.inactive</code>
            </pre>
          </div>
          <div>
            <p className="text-sm text-slate-300 mb-2">Greater than:</p>
            <pre className="bg-slate-900 rounded-lg p-3">
              <code className="text-xs text-slate-300">amount > gte.100</code>
            </pre>
          </div>
          <div>
            <p className="text-sm text-slate-300 mb-2">LIKE pattern:</p>
            <pre className="bg-slate-900 rounded-lg p-3">
              <code className="text-xs text-slate-300">email LIKE %@example.com</code>
            </pre>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Note: Filters use PostgREST syntax. See the{' '}
          <Link href="/docs/database" className="text-emerald-400 hover:underline">
            Database docs
          </Link>
          {' '}for more details.
        </p>
      </div>

      {/* Unsubscribe Example */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Unsubscribe
        </h3>
        <pre className="bg-slate-900 rounded-lg p-4">
          <code className="text-sm text-slate-300">{`// Leave a channel
const unsubscribe = {
  event: 'phx_leave',
  topic: 'realtime:users',
  payload: {},
  ref: '2'
};

ws.send(JSON.stringify(unsubscribe));

// Or close the connection entirely
ws.close();`}</code>
        </pre>
        <p className="text-sm text-slate-400 mt-3">
          Leaving a specific channel while keeping the connection open allows you to subscribe to
          other channels without reconnecting.
        </p>
      </div>
    </motion.div>
  );
}
