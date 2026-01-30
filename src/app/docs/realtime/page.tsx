'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Radio, Database, Zap, Shield, CheckCircle2, BookOpen, MessageSquare, Users } from 'lucide-react';
import Link from 'next/link';

export default function RealtimeDocs() {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    >
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documentation
          </Link>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Radio className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-100 mb-2">Realtime</h1>
              <p className="text-lg text-slate-400">
                Database-driven realtime subscriptions using Postgres CDC (Change Data Capture)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overview */}
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

        {/* Core Concepts */}
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

        {/* Limits */}
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

        {/* WebSocket Connection */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">WebSocket Connection</h2>

          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-slate-300 text-lg leading-relaxed mb-4">
              Connect to the NextMavens Realtime service using WebSockets. The service uses standard
              WebSocket protocol with JWT authentication and supports both browser and Node.js environments.
            </p>
          </div>

          {/* WebSocket URL Format */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              WebSocket URL Format
            </h3>
            <pre className="bg-slate-900 rounded-lg p-4 mb-4">
              <code className="text-sm text-slate-300">wss://realtime.nextmavens.cloud</code>
            </pre>
            <p className="text-sm text-slate-400 mb-2">
              For local development, use: <code className="text-emerald-400">ws://localhost:4000/socket/websocket</code>
            </p>
            <p className="text-sm text-slate-400">
              The URL includes the project context through JWT authentication. All connections must include a valid JWT token.
            </p>
          </div>

          {/* Authentication */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Authentication
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-300 mb-2">Include your JWT token when connecting:</p>
                <pre className="bg-slate-900 rounded-lg p-4">
                  <code className="text-sm text-slate-300">{`// Query parameter approach (recommended)
const ws = new WebSocket(\`wss://realtime.nextmavens.cloud?token=YOUR_JWT_TOKEN\`)

// Or.</p>
const ws = new WebSocket('wss://realtime.nextmavens.cloud', ['your_jwt_token'])`}</code>
                </pre>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Note:</strong> JWT tokens are obtained from the control plane API. Use your service role key for server-side connections.
                </p>
              </div>
            </div>
          </div>

          {/* JavaScript Example */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>JavaScript Example</span>
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Browser-based WebSocket connection with automatic reconnection:
            </p>
            <pre className="bg-slate-900 rounded-lg p-4 mt-4 overflow-x-auto">
              <code className="text-sm text-slate-300">{`const token = 'your_jwt_token';
const ws = new WebSocket(\`wss://realtime.nextmavens.cloud?token=\${token}\`);

ws.onopen = () => {
  console.log('Connected to Realtime!');

  // Subscribe to a channel
  ws.send(JSON.stringify({
    event: 'phx_join',
    topic: 'realtime:users',
    payload: { token },
    ref: '1'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.event === 'INSERT') {
    console.log('New user:', message.payload.new);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from Realtime');
  // Implement reconnection logic here
};`}</code>
            </pre>
          </div>

          {/* Python Example */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-green-400" />
              Python Example
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Server-side WebSocket connection using the <code className="text-emerald-400">websockets</code> library:
            </p>
            <pre className="bg-slate-900 rounded-lg p-4 mt-4 overflow-x-auto">
              <code className="text-sm text-slate-300">{`import asyncio
import websockets
import json

JWT_TOKEN = 'your_jwt_token'
REALTIME_URL = 'wss://realtime.nextmavens.cloud'

async def connect_realtime():
    uri = f'{REALTIME_URL}?token={JWT_TOKEN}'

    async with websockets.connect(uri) as websocket:
        print('Connected to Realtime!')

        # Subscribe to a channel
        subscription_message = {
            'event': 'phx_join',
            'topic': 'realtime:users',
            'payload': {'token': JWT_TOKEN},
            'ref': '1'
        }
        await websocket.send(json.dumps(subscription_message))

        # Listen for messages
        while True:
            message = await websocket.recv()
            data = json.loads(message)

            if data.get('event') == 'INSERT':
                print(f'New user: {data["payload"]["new"]}')

# Run the connection
asyncio.run(connect_realtime())`}</code>
            </pre>
          </div>

          {/* Error Handling */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Error Handling
            </h3>
            <ul className="space-y-2 text-amber-200/80 text-sm">
              <li>• <strong className="text-amber-300">Invalid Token (4001):</strong> JWT token is expired or invalid. Refresh and retry with a new token.</li>
              <li>• <strong className="text-amber-300">Connection Refused:</strong> Check firewall rules - port 443 must be open for WSS connections.</li>
              <li>• <strong className="text-amber-300">Timeout:</strong> Implement reconnection with exponential backoff (1s, 2s, 4s, 8s, 16s...).</li>
              <li>• <strong className="text-amber-300">Rate Limit (429):</strong> Max 100 messages/second per project. Implement backpressure handling.</li>
              <li>• <strong className="text-amber-300">Project Suspended (4003):</strong> Project has been suspended. Contact support for assistance.</li>
              <li>• <strong className="text-amber-300">Connection Limit (4002):</strong> Maximum 50 concurrent connections per project reached.</li>
            </ul>
          </div>
        </motion.div>

        {/* Subscriptions */}
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
             .</div>
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
      filter: 'status = active AND created_at > NOW() - INTERVAL '7 days''
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
                </不一定>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Note: Filters use PostgREST syntax. See the{' '}
              <a href="/docs/database" className="text-emerald-400 hover:underline">Database docs</a>
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

// Or.</p>
ws.close();`}</code>
            </pre>
            <p className="text-sm text-slate-400 mt-3">
              Leaving a specific channel while keeping the connection open allows you to subscribe to
              other channels without reconnecting.
            </p>
          </div>
        </motion.div>

        {/* Examples */}
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

        {/* Events Reference */}
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
                <tr className="hover:bg-slate-700/30">
                  <td className="px-6 py-4">
                    <code className="text-emerald-400">INSERT</code>
                  </td>
                  <td className="px-6 py-4 text-slate-300">New row created</td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-slate-400">{"{ new: {...} }"}</code>
                  </td>
                </tr>
                <tr className="hover:bg-slate-700/30">
                  <td className="px-6 py-4">
                    <code className="text-blue-400">UPDATE</code>
                  </td>
                  <td className="px-6 py-4 text-slate-300">Row modified</td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-slate-400">{"{ old: {...}, new: {...} }"}</code>
                  </td>
                </tr>
                <tr className="hover:bg-slate-700/30">
                  <td className="px-6 py-4">
                    <code className="text-red-400">DELETE</code>
                  </td>
                  <td className="px-6 py-4 text-slate-300">Row removed</td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-slate-400">{"{ old: {...} }"}</code>
                  </td>
                </tr>
                <tr className="hover:bg-slate-700/30">
                  <td className="px-6 py-4">
                    <code className="text-orange-400">TRUNCATE</code>
                  </td>
                  <td className="px-6 py-4 text-slate-300">All rows removed (table truncated)</td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-slate-400">""</code>
                  </td
                </tr>
                <tr className="hover:bg-slate-700/30">
                  <td className="px-6 py-4">
                    <code className="text-purple-400">*</code>
                  </td>
                  <td className="px-6 py-4 text-slate-300">All events</td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-slate-400">Varies by event</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Resources */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Resources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="https://www.postgresql.org/docs/current/logicaldecoding.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-4 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-colors"
            >
              <BookOpen className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-100 mb-1">Postgres Logical Replication</h3>
                <p className="text-sm text-slate-400">Official documentation on CDC</p>
              </div>
            </a>
            <a
              href="/docs/database"
              className="flex items-start gap-4 p-4 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-colors"
            >
              <Database className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-100 mb-1">Database Documentation</h3>
                <p className="text-sm text-slate-400">SQL queries and schema management</p>
              </div>
            </a>
          </div>
        </motion.div>

        {/* Footer Navigation */}
        <motion.div variants={itemVariants} className="flex justify-between pt-8 border-t border-slate-700/50">
          <Link
            href="/docs/mcp"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            MCP Integration
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            All Documentation
            <MessageSquare className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
