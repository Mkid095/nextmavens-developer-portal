'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Radio, Database, Zap, Shield, CheckCircle2, BookOpen, MessageSquare, Users, RefreshCw, Clock, Power, Lock, UserPlus, UserMinus, Signal, Megaphone, Send, Code, Play, FileCode, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy';

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

        {/* Channel Prefixing & Isolation */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Channel Prefixing & Isolation</h2>

          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-slate-300 text-lg leading-relaxed mb-4">
              Channel prefixing provides project-level isolation for realtime subscriptions. Each project has a unique
              <code className="text-emerald-400"> project_id:</code> prefix that must be included in all channel names,
              ensuring that clients can only subscribe to their own project's data.
            </p>
          </div>

          {/* Channel Format with Project ID */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              Full Channel Format
            </h3>
            <pre className="bg-slate-900 rounded-lg p-4 mb-4">
              <code className="text-sm text-slate-300">project_id:table_name</code>
            </pre>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-2">project_id (prefix)</p>
                <p className="text-sm text-slate-300">
                  Your unique project identifier. This is automatically extracted from your JWT token and used to
                  isolate your realtime subscriptions from other projects.
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-2">table_name (suffix)</p>
                <p className="text-sm text-slate-300">
                  The database table you want to subscribe to. Can include schema prefix for custom schemas
                  (e.g., <code className="text-emerald-400">public.users</code>).
                </p>
              </div>
            </div>
          </div>

          {/* Valid vs Invalid Channel Names */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Valid vs Invalid Channel Names
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Assuming your <code className="text-emerald-400">project_id</code> is <code className="text-emerald-400">abc123xyz</code>:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-emerald-300 mb-3">✓ Valid Channel Names</p>
                <div className="space-y-2">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                    <code className="text-xs text-emerald-200">abc123xyz:users</code>
                    <p className="text-xs text-emerald-300/70 mt-1">Basic table subscription</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                    <code className="text-xs text-emerald-200">abc123xyz:public.products</code>
                    <p className="text-xs text-emerald-300/70 mt-1">Table with schema prefix</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                    <code className="text-xs text-emerald-200">abc123xyz:user_notifications</code>
                    <p className="text-xs text-emerald-300/70 mt-1">Table with underscore</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-300 mb-3">✗ Invalid Channel Names</p>
                <div className="space-y-2">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <code className="text-xs text-red-200">users</code>
                    <p className="text-xs text-red-300/70 mt-1">Missing project_id prefix</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <code className="text-xs text-red-200">def456uvw:orders</code>
                    <p className="text-xs text-red-300/70 mt-1">Different project_id (403 error)</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <code className="text-xs text-red-200">abc123xyz:</code>
                    <p className="text-xs text-red-300/70 mt-1">Missing table_name suffix</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-Project Access */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Cross-Project Access Protection
            </h3>
            <p className="text-amber-200/80 text-sm mb-4">
              Attempting to subscribe to a different project's channels will result in a <strong className="text-amber-300">403 Forbidden</strong> error.
              The project_id is automatically extracted from your JWT token's claims, ensuring strict isolation.
            </p>
            <pre className="bg-slate-900/50 rounded-lg p-4">
              <code className="text-sm text-amber-200/80">{`// JWT token contains project_id: "abc123xyz"
// Attempting to subscribe to different project's channel

{
  event: 'phx_join',
  topic: 'def456uvw:users',  // Different project_id
  payload: { token: 'YOUR_JWT_TOKEN' },
  ref: '1'
}

// Server Response:
{
  event: 'phx_reply',
  ref: '1',
  payload: {
    status: 'error',
    reason: 'Forbidden: Project ID mismatch'
  }
}`}</code>
            </pre>
          </div>

          {/* Auto-Prefix Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Automatic Project ID Resolution
            </h3>
            <p className="text-blue-200/80 text-sm">
              In most client libraries, you can omit the <code className="text-blue-300">project_id:</code> prefix from channel names.
              The client SDK automatically extracts the project_id from your JWT token and prepends it to all channel names.
              However, when using raw WebSocket connections, you must include the full <code className="text-blue-300">project_id:table_name</code> format.
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

        {/* Lifecycle Management */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Connection Lifecycle</h2>

          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-slate-300 text-lg leading-relaxed mb-4">
              Managing the lifecycle of WebSocket connections is essential for building reliable realtime applications.
              Understanding connection states, implementing proper reconnection logic, and handling graceful shutdowns
              ensures a seamless user experience.
            </p>
          </div>

          {/* Connection States */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              Connection States
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              WebSocket connections progress through these states during their lifecycle:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></div>
                  <span className="font-semibold text-slate-200">CONNECTING</span>
                </div>
                <p className="text-sm text-slate-400">Initial handshake in progress. Connection not yet established.</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="font-semibold text-slate-200">OPEN</span>
                </div>
                <p className="text-sm text-slate-400">Connection established. Ready to send and receive messages.</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                  <span className="font-semibold text-slate-200">CLOSING</span>
                </div>
                <p className="text-sm text-slate-400">Close handshake initiated. Connection shutting down gracefully.</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <span className="font-semibold text-slate-200">CLOSED</span>
                </div>
                <p className="text-sm text-slate-400">Connection terminated. Must reconnect to resume communication.</p>
              </div>
            </div>
            <pre className="bg-slate-900 rounded-lg p-4 mt-4">
              <code className="text-sm text-slate-300">{`// Monitoring connection state
const ws = new WebSocket('wss://realtime.nextmavens.cloud?token=YOUR_JWT');

console.log('Initial state:', ws.readyState); // 0 = CONNECTING

ws.onopen = () => {
  console.log('State:', ws.readyState); // 1 = OPEN
};

ws.onclose = () => {
  console.log('State:', ws.readyState); // 3 = CLOSED
};`}</code>
            </pre>
          </div>

          {/* Reconnection Logic */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              Reconnection Logic
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Network interruptions are inevitable. Implement exponential backoff for reliable reconnection:
            </p>
            <pre className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300">{`class ReconnectingWebSocket {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.ws = null;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Cap at 30 seconds
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  connect() {
    this.ws = new WebSocket(\`\${this.url}?token=\${this.token}\`);

    this.ws.onopen = () => {
      console.log('Connected to Realtime');
      this.reconnectDelay = 1000; // Reset delay on successful connection
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      console.log('Disconnected. Attempting to reconnect...');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(\`Reconnection attempt \${this.reconnectAttempts}\`);
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff: double the delay each time
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.maxReconnectDelay
    );
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }
}

// Usage
const ws = new ReconnectingWebSocket(
  'wss://realtime.nextmavens.cloud',
  'YOUR_JWT_TOKEN'
);
ws.connect();`}</code>
            </pre>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-xs text-emerald-300 mb-1">Initial Delay</p>
                <p className="text-sm font-semibold text-emerald-200">1 second</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300 mb-1">Backoff Strategy</p>
                <p className="text-sm font-semibold text-blue-200">Exponential (2x)</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <p className="text-xs text-orange-300 mb-1">Max Delay</p>
                <p className="text-sm font-semibold text-orange-200">30 seconds</p>
              </div>
            </div>
          </div>

          {/* Heartbeat/Keepalive */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Heartbeat & Keepalive
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              The service sends periodic heartbeat messages to detect inactive connections. Keep your connection alive:
            </p>
            <pre className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300">{`const ws = new WebSocket('wss://realtime.nextmavens.cloud?token=YOUR_JWT');
let lastHeartbeat = Date.now();
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 60000; // 60 seconds

// Handle incoming heartbeat messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.event === 'heartbeat') {
    lastHeartbeat = Date.now();
    console.log('Heartbeat received');
    // Optionally respond with pong
    ws.send(JSON.stringify({ event: 'pong' }));
  }
};

// Monitor for heartbeat timeout
setInterval(() => {
  const timeSinceLastHeartbeat = Date.now() - lastHeartbeat;

  if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
    console.warn('Heartbeat timeout. Connection may be dead.');
    ws.close(); // Force close to trigger reconnection
  }
}, HEARTBEAT_INTERVAL);

// Alternatively, implement client-side ping
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event: 'ping' }));
  }
}, 45000); // Send ping every 45 seconds`}</code>
            </pre>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mt-4">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> The service sends heartbeat messages every 30 seconds. Connections that don't receive
                a heartbeat within 60 seconds are considered stale and may be terminated.
              </p>
            </div>
          </div>

          {/* Graceful Shutdown */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Power className="w-5 h-5 text-red-400" />
              Graceful Shutdown
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Properly close connections to avoid resource leaks and ensure data integrity:
            </p>
            <pre className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300">{`const ws = new WebSocket('wss://realtime.nextmavens.cloud?token=YOUR_JWT');

// Unsubscribe from channels before closing
function gracefulShutdown() {
  if (ws.readyState === WebSocket.OPEN) {
    // Leave all channels
    const channels = ['realtime:users', 'realtime:orders', 'realtime:messages'];

    channels.forEach((channel, index) => {
      ws.send(JSON.stringify({
        event: 'phx_leave',
        topic: channel,
        payload: {},
        ref: String(index + 1)
      }));
    });

    // Wait for acknowledgments, then close
    setTimeout(() => {
      ws.close(1000, 'Graceful shutdown'); // 1000 = Normal Closure
    }, 500);
  }
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  gracefulShutdown();
});

// Handle app visibility changes (optional)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('App hidden. Keeping connection alive for quick resume.');
  } else {
    console.log('App visible. Connection active.');
  }
});

// Manual shutdown button
document.getElementById('disconnect-btn')?.addEventListener('click', () => {
  gracefulShutdown();
});`}</code>
            </pre>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Close Code 1000</p>
                <p className="text-sm text-slate-300">Normal Closure - connection completed successfully</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Best Practice</p>
                <p className="text-sm text-slate-300">Always unsubscribe before closing to prevent ghost subscriptions</p>
              </div>
            </div>
          </div>

          {/* Lifecycle Diagram */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Connection Lifecycle Flow
            </h3>
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="w-12 h-12 rounded-full bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center mb-2">
                  <span className="text-yellow-400 text-xs font-bold">1</span>
                </div>
                <span className="text-sm text-slate-300 text-center">CONNECTING</span>
                <span className="text-xs text-slate-500 text-center">Init handshake</span>
              </div>
              <div className="text-slate-600">→</div>
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="w-12 h-12 rounded-full bg-emerald-400/20 border-2 border-emerald-400 flex items-center justify-center mb-2">
                  <span className="text-emerald-400 text-xs font-bold">2</span>
                </div>
                <span className="text-sm text-slate-300 text-center">OPEN</span>
                <span className="text-xs text-slate-500 text-center">Active data flow</span>
              </div>
              <div className="text-slate-600">↔</div>
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="w-12 h-12 rounded-full bg-orange-400/20 border-2 border-orange-400 flex items-center justify-center mb-2">
                  <span className="text-orange-400 text-xs font-bold">3</span>
                </div>
                <span className="text-sm text-slate-300 text-center">CLOSING</span>
                <span className="text-xs text-slate-500 text-center">Close handshake</span>
              </div>
              <div className="text-slate-600">→</div>
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="w-12 h-12 rounded-full bg-red-400/20 border-2 border-red-400 flex items-center justify-center mb-2">
                  <span className="text-red-400 text-xs font-bold">4</span>
                </div>
                <span className="text-sm text-slate-300 text-center">CLOSED</span>
                <span className="text-xs text-slate-500 text-center">Terminated</span>
              </div>
              <div className="text-slate-600">↻</div>
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="w-12 h-12 rounded-full bg-blue-400/20 border-2 border-blue-400 flex items-center justify-center mb-2">
                  <RefreshCw className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-sm text-slate-300 text-center">RECONNECT</span>
                <span className="text-xs text-slate-500 text-center">Retry with backoff</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Presence */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Presence</h2>

          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-slate-300 text-lg leading-relaxed mb-4">
              Presence features enable you to track online users, monitor user state, and detect when users join or leave channels.
              Build collaborative features like cursors, typing indicators, and live user lists.
            </p>
          </div>

          {/* Online Status Tracking */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Signal className="w-5 h-5 text-emerald-400" />
              Track Online Status
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Use presence to track which users are currently online and active:
            </p>
            <pre className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300">{`// Join a presence channel
const presenceJoin = {
  event: 'phx_join',
  topic: 'presence:users',
  payload: {
    token: 'YOUR_JWT_TOKEN',
    user_id: 'user_123',
    user_metadata: {
      name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg'
    }
  },
  ref: '1'
};

ws.send(JSON.stringify(presenceJoin));

// Handle presence state sync
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.event === 'presence_state') {
    // Initial presence state - all online users
    const onlineUsers = msg.payload;
    console.log('Online users:', onlineUsers);
    // Render online user list
    renderOnlineUsers(onlineUsers);
  }
};`}</code>
            </pre>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-xs text-emerald-300 mb-1">presence_state</p>
                <p className="text-sm font-semibold text-emerald-200">Initial sync</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300 mb-1">presence_diff</p>
                <p className="text-sm font-semibold text-blue-200">Incremental updates</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-xs text-purple-300 mb-1">Channel Format</p>
                <p className="text-sm font-semibold text-purple-200">presence:*</p>
              </div>
            </div>
          </div>

          {/* User State Tracking */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Track User State
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Track dynamic user state like cursor position, typing status, or current activity:
            </p>
            <pre className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300">{`// Track user cursor position
const updatePresence = {
  event: 'presence_update',
  topic: 'presence:collaboration',
  payload: {
    token: 'YOUR_JWT_TOKEN',
    user_id: 'user_123',
    state: {
      cursor: { x: 450, y: 230 },
      typing: false,
      selection: { start: 10, end: 15 },
      current_file: 'document.txt'
    }
  },
  ref: '2'
};

ws.send(JSON.stringify(updatePresence));

// Listen for presence updates from other users
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.event === 'presence_diff') {
    // Users joined or left
    const { joins, leaves } = msg.payload;

    Object.keys(joins).forEach(userId => {
      console.log(\`User \${userId} joined\`);
      showUserCursor(userId, joins[userId]);
    });

    Object.keys(leaves).forEach(userId => {
      console.log(\`User \${userId} left\`);
      removeUserCursor(userId);
    });
  }

  if (msg.event === 'presence_update') {
    // User state changed
    const { user_id, state } = msg.payload;
    updateUserCursor(user_id, state);
  }
};`}</code>
            </pre>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mt-4">
              <p className="text-sm text-blue-300">
                <strong>Use Cases:</strong> Collaborative cursors, typing indicators, shared whiteboards, multiplayer games, live auctions.
              </p>
            </div>
          </div>

          {/* Join/Leave Channels */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-400" />
              Join and Leave Channels
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Handle users entering and exiting presence channels:
            </p>
            <pre className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300">{`// Join a presence channel
function joinPresenceChannel(channelName, userState) {
  const joinMsg = {
    event: 'phx_join',
    topic: \`presence:\${channelName}\`,
    payload: {
      token: 'YOUR_JWT_TOKEN',
      ...userState
    },
    ref: String(Date.now())
  };

  ws.send(JSON.stringify(joinMsg));
}

// Leave a presence channel
function leavePresenceChannel(channelName) {
  const leaveMsg = {
    event: 'phx_leave',
    topic: \`presence:\${channelName}\`,
    payload: {
      token: 'YOUR_JWT_TOKEN'
    },
    ref: String(Date.now())
  };

  ws.send(JSON.stringify(leaveMsg));
}

// Usage
joinPresenceChannel('room_123', {
  user_id: 'user_456',
  username: 'alice',
  avatar: 'https://example.com/alice.jpg',
  role: 'editor'
});

// When user navigates away
window.addEventListener('beforeunload', () => {
  leavePresenceChannel('room_123');
});

// Handle join/leave events from other users
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.event === 'presence_diff') {
    const { joins, leaves } = msg.payload;

    // New users joined
    Object.entries(joins).forEach(([userId, userData]) => {
      showNotification(\`\${userData.username} joined the room\`);
      addUserToList(userId, userData);
    });

    // Users left
    Object.keys(leaves).forEach(userId => {
      showNotification(\`User left the room\`);
      removeUserFromList(userId);
    });
  }
};`}</code>
            </pre>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-xs text-emerald-300 mb-1">phx_join</p>
                <p className="text-sm text-emerald-200">User enters presence channel</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-xs text-red-300 mb-1">phx_leave</p>
                <p className="text-sm text-red-200">User exits presence channel</p>
              </div>
            </div>
          </div>

          {/* Presence Examples */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Presence Examples
            </h3>

            {/* Typing Indicator */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-200 mb-3">Typing Indicator</p>
              <pre className="bg-slate-900 rounded-lg p-4">
                <code className="text-sm text-slate-300">{`// Send typing status
function setTyping(isTyping) {
  ws.send(JSON.stringify({
    event: 'presence_update',
    topic: 'presence:chat',
    payload: {
      token: 'YOUR_JWT_TOKEN',
      user_id: 'user_123',
      state: { typing: isTyping }
    }
  }));
}

// On textarea input
textarea.addEventListener('input', () => {
  setTyping(true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => setTyping(false), 1000);
});

// Listen for typing from others
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.event === 'presence_update') {
    const { user_id, state } = msg.payload;
    if (state.typing) {
      showTypingIndicator(user_id);
    } else {
      hideTypingIndicator(user_id);
    }
  }
};`}</code>
              </pre>
            </div>

            {/* Online User Counter */}
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-3">Online User Counter</p>
              <pre className="bg-slate-900 rounded-lg p-4">
                <code className="text-sm text-slate-300">{`let onlineUsers = new Map();

// Initial presence state
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.event === 'presence_state') {
    // Load initial online users
    Object.entries(msg.payload).forEach(([userId, userData]) => {
      onlineUsers.set(userId, userData);
    });
    updateOnlineCount();
  }

  if (msg.event === 'presence_diff') {
    // Handle incremental changes
    const { joins, leaves } = msg.payload;

    Object.entries(joins).forEach(([userId, userData]) => {
      onlineUsers.set(userId, userData);
    });

    Object.keys(leaves).forEach(userId => {
      onlineUsers.delete(userId);
    });

    updateOnlineCount();
  }
};

function updateOnlineCount() {
  const count = onlineUsers.size;
  document.getElementById('online-count').textContent =
    \`\${count} user\${count !== 1 ? 's' : ''} online\`;
}`}</code>
              </pre>
            </div>
          </div>
        </motion.div>

        {/* Broadcast */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Broadcast</h2>

          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-slate-300 text-lg leading-relaxed mb-4">
              Broadcast enables server-side push of messages to all subscribed clients. Unlike database-driven subscriptions
              that respond to data changes, broadcast allows you to send arbitrary messages from your server code to clients
              in real-time.
            </p>
          </div>

          {/* Server-Side Broadcast API */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" />
              Server-Side Broadcast API
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Use the broadcast API to send messages from your server to all connected clients:
            </p>
            <pre className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300">{`import { broadcast } from '@nextmavens/realtime';

// Broadcast a message to all subscribers of a channel
await broadcast({
  channel: 'realtime:notifications',
  event: 'announcement',
  payload: {
    title: 'System Maintenance',
    message: 'Scheduled maintenance in 1 hour',
    severity: 'info',
    timestamp: new Date().toISOString()
  }
});

// Broadcast to a specific project's channel
await broadcast({
  channel: 'abc123xyz:notifications',
  event: 'alert',
  payload: {
    type: 'security',
    message: 'New login detected from unknown device'
  }
});`}</code>
            </pre>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">channel</p>
                <p className="text-sm text-slate-300">Target channel for broadcast (format: project_id:table_name or realtime:table_name)</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">event</p>
                <p className="text-sm text-slate-300">Event name for the broadcast message (custom event names supported)</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">payload</p>
                <p className="text-sm text-slate-300">JSON-serializable data to send to clients (max 64KB)</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Rate Limit</p>
                <p className="text-sm text-slate-300">Max 100 broadcasts/second per project</p>
              </div>
            </div>
          </div>

          {/* Client Broadcast Examples */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-400" />
              Client-Side Broadcast Handling
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Clients receive broadcast messages through their existing WebSocket connections:
            </p>
            <pre className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300">{`// Subscribe to broadcast channel
const subscribe = {
  event: 'phx_join',
  topic: 'realtime:notifications',
  payload: { token: 'YOUR_JWT_TOKEN' },
  ref: '1'
};

ws.send(JSON.stringify(subscribe));

// Listen for broadcast events
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.event === 'announcement') {
    const { title, message, severity, timestamp } = msg.payload;
    showNotification(title, message, severity);
  }

  if (msg.event === 'alert') {
    const { type, message } = msg.payload;
    showAlert(type, message);
  }

  if (msg.event === 'update') {
    const { data } = msg.payload;
    updateUI(data);
  }
};`}</code>
            </pre>
          </div>

          {/* Use Cases */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-400" />
              Common Use Cases
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Notifications */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  Push Notifications
                </h4>
                <p className="text-xs text-purple-200/80 mb-3">
                  Send real-time notifications to all connected users without database changes.
                </p>
                <pre className="bg-slate-900/50 rounded p-3">
                  <code className="text-xs text-purple-200/80">{`await broadcast({
  channel: 'realtime:notifications',
  event: 'notification',
  payload: {
    title: 'New Message',
    body: 'You have a new message from Alice',
    icon: 'message',
    click_url: '/messages/123'
  }
});`}</code>
                </pre>
              </div>

              {/* Announcements */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  System Announcements
                </h4>
                <p className="text-xs text-blue-200/80 mb-3">
                  Broadcast important system-wide announcements to all users.
                </p>
                <pre className="bg-slate-900/50 rounded p-3">
                  <code className="text-xs text-blue-200/80">{`await broadcast({
  channel: 'realtime:announcements',
  event: 'maintenance',
  payload: {
    title: 'Scheduled Maintenance',
    message: 'System will be down for maintenance in 30 minutes',
    scheduled_at: '2024-02-01T02:00:00Z',
    duration_minutes: 30
  }
});`}</code>
                </pre>
              </div>

              {/* Live Updates */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Live Score Updates
                </h4>
                <p className="text-xs text-emerald-200/80 mb-3">
                  Push live game scores, stock prices, or auction bids in real-time.
                </p>
                <pre className="bg-slate-900/50 rounded p-3">
                  <code className="text-xs text-emerald-200/80">{`await broadcast({
  channel: 'realtime:scores',
  event: 'score_update',
  payload: {
    game_id: 'nfl-2024-01-15',
    team_home: { name: 'Chiefs', score: 24 },
    team_away: { name: 'Eagles', score: 21 },
    quarter: 4,
    time_remaining: '2:35'
  }
});`}</code>
                </pre>
              </div>

              {/* Collaborative Updates */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-orange-300 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Collaborative Updates
                </h4>
                <p className="text-xs text-orange-200/80 mb-3">
                  Signal collaborative actions like document edits or cursor movements.
                </p>
                <pre className="bg-slate-900/50 rounded p-3">
                  <code className="text-xs text-orange-200/80">{`await broadcast({
  channel: 'realtime:collab',
  event: 'user_action',
  payload: {
    user_id: 'user_123',
    action: 'cursor_move',
    position: { x: 450, y: 230 },
    timestamp: Date.now()
  }
});`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Broadcast vs Database Events */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Broadcast vs Database Events
            </h3>
            <p className="text-blue-200/80 text-sm mb-4">
              Understanding when to use broadcast versus database-driven subscriptions:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-sm font-semibold text-emerald-300 mb-2">Use Database Events When:</p>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• Data is stored in database tables</li>
                  <li>• Changes need to be persisted</li>
                  <li>• Multiple services need access to data</li>
                  <li>• Audit trail is required</li>
                  <li>• Filtering by SQL WHERE clauses</li>
                </ul>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-sm font-semibold text-blue-300 mb-2">Use Broadcast When:</p>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• Sending transient notifications</li>
                  <li>• Real-time signals without persistence</li>
                  <li>• Custom event types needed</li>
                  <li>• Low-latency push required</li>
                  <li>• Server-initiated communication</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Troubleshooting */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Troubleshooting</h2>

          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-slate-300 text-lg leading-relaxed mb-4">
              Common issues and their solutions to help you debug realtime connection problems.
            </p>
          </div>

          {/* Connection Issues */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Connection Issues
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-semibold">Problem:</span>
                  <div className="flex-1">
                    <p className="text-slate-300">Connection closes immediately after opening</p>
                    <p className="text-sm text-slate-400 mt-2">Possible causes: Invalid JWT token, expired token, or missing authentication</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-300 mb-2">Solution:</p>
                  <ul className="text-sm text-emerald-200/80 space-y-1">
                    <li>Verify JWT token is valid and not expired</li>
                    <li>Check token includes project_id claim</li>
                    <li>Ensure token has required scope (realtime:subscribe)</li>
                    <li>Try refreshing token from control plane API</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-semibold">Problem:</span>
                  <div className="flex-1">
                    <p className="text-slate-300">403 Forbidden when subscribing to channels</p>
                    <p className="text-sm text-slate-400 mt-2">Possible causes: Project ID mismatch, insufficient permissions, wrong channel format</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-300 mb-2">Solution:</p>
                  <ul className="text-sm text-emerald-200/80 space-y-1">
                    <li>Verify project_id in JWT matches channel prefix</li>
                    <li>Use correct channel format: project_id:table_name</li>
                    <li>Check user has permission to access the project</li>
                    <li>Ensure realtime service is enabled for project</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-semibold">Problem:</span>
                  <div className="flex-1">
                    <p className="text-slate-300">Connection drops frequently or randomly</p>
                    <p className="text-sm text-slate-400 mt-2">Possible causes: Network instability, server-side issues, heartbeat timeout</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-300 mb-2">Solution:</p>
                  <ul className="text-sm text-emerald-200/80 space-y-1">
                    <li>Implement reconnection logic with exponential backoff</li>
                    <li>Check network connectivity and firewall rules</li>
                    <li>Verify heartbeat messages are being received</li>
                    <li>Check if project has exceeded connection limit (50 connections)</li>
                    <li>Monitor browser console for WebSocket error codes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Issues */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Radio className="w-5 h-5 text-orange-400" />
              Subscription Issues
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-semibold">Problem:</span>
                  <div className="flex-1">
                    <p className="text-slate-300">Not receiving data changes for subscribed table</p>
                    <p className="text-sm text-slate-400 mt-2">Possible causes: Wrong channel name, invalid filter, no data changes occurring</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-300 mb-2">Solution:</p>
                  <ul className="text-sm text-emerald-200/80 space-y-1">
                    <li>Verify channel name format: project_id:table_name</li>
                    <li>Check filter syntax uses proper format (eq., gte., lte.)</li>
                    <li>Test filter works by running same query in database</li>
                    <li>Ensure table is in public schema or include schema prefix</li>
                    <li>Check that INSERT/UPDATE/DELETE operations are happening on the table</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-semibold">Problem:</span>
                  <div className="flex-1">
                    <p className="text-slate-300">Receiving duplicate events for the same change</p>
                    <p className="text-sm text-slate-400 mt-2">Possible causes: Multiple subscriptions to same table, client sending duplicate messages</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-300 mb-2">Solution:</p>
                  <ul className="text-sm text-emerald-200/80 space-y-1">
                    <li>Check for duplicate phx_join messages in your code</li>
                    <li>Ensure you're not creating multiple WebSocket connections</li>
                    <li>Add duplicate detection using event ID or timestamp</li>
                    <li>Track seen events in a Set to filter duplicates</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-semibold">Problem:</span>
                  <div className="flex-1">
                    <p className="text-slate-300">Filter not working as expected</p>
                    <p className="text-sm text-slate-400 mt-2">Possible causes: Invalid SQL syntax, wrong filter format, case sensitivity</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-300 mb-2">Solution:</p>
                  <ul className="text-sm text-emerald-200/80 space-y-1">
                    <li>Use PostgREST filter syntax: column=value (eq.123, gte.100)</li>
                    <li>String comparisons are case-sensitive (use ILIKE for case-insensitive)</li>
                    <li>Multiple conditions: use AND/OR operators</li>
                    <li>Test filter in Database Explorer before using in realtime</li>
                    <li>Escape special characters: use LIKE operator with % wildcards</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Issues */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Performance Issues
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-semibold">Problem:</span>
                  <div className="flex-1">
                    <p className="text-slate-300">High latency or slow message delivery</p>
                    <p className="text-sm text-slate-400 mt-2">Possible causes: Network latency, server overload, large message payloads</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-300 mb-2">Solution:</p>
                  <ul className="text-sm text-emerald-200/80 space-y-1">
                    <li>Check message payload size - max 64KB per message</li>
                    <li>Optimize subscriptions by using specific filters</li>
                    <li>Reduce number of subscribed tables (max 10 per connection)</li>
                    <li>Monitor network latency using ping/pong messages</li>
                    <li>Consider using separate connections for critical updates</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-semibold">Problem:</span>
                  <div className="flex-1">
                    <p className="text-slate-300">Rate limit errors (429)</p>
                    <p className="text-sm text-slate-400 mt-2">Possible causes: Exceeding 100 messages/second limit, too many broadcasts</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-300 mb-2">Solution:</p>
                  <ul className="text-sm text-emerald-200/80 space-y-1">
                    <li>Implement message batching or debouncing</li>
                    <li>Reduce broadcast frequency from server code</li>
                    <li>Use database events instead of broadcasts when possible</li>
                    <li>Implement client-side message queuing</li>
                    <li>Contact support to increase rate limit if needed</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 font-semibold">Problem:</span>
                  <div className="flex-1">
                    <p className="text-slate-300">High memory usage in browser</p>
                    <p className="text-sm text-slate-400 mt-2">Possible causes: Accumulating message history, large presence state, memory leaks</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-300 mb-2">Solution:</p>
                  <ul className="text-sm text-emerald-200/80 space-y-1">
                    <li>Limit message history buffer size (keep last 100 messages)</li>
                    <li>Clean up presence state when users leave</li>
                    <li>Remove event listeners when disconnecting</li>
                    <li>Use WeakMap for storing user state</li>
                    <li>Implement periodic cleanup for old data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Debug Tips */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Debug Logging Tips
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-sm font-semibold text-slate-200 mb-2">Enable WebSocket Debug Logging</p>
                <pre className="bg-slate-900 rounded-lg p-3">
                  <code className="text-xs text-slate-300">{`// Browser development tools
// 1. Open DevTools (F12)
// 2. Go to Console tab
// 3. Enable verbose logging:
ws.addEventListener('message', (event) => {
  console.log('WebSocket message:', event.data);
});

// 4. Enable WebSocket logging in Chrome:
// - Navigate to chrome://websockets
// - Find your connection
// - View detailed log of all frames`}</code>
                </pre>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-sm font-semibold text-slate-200 mb-2">Server-Side Logging</p>
                <pre className="bg-slate-900 rounded-lg p-3">
                  <code className="text-xs text-slate-300">{`// Enable detailed logging in development
import { setLogLevel } from '@nextmavens/realtime';

setLogLevel('debug');

// This logs all connection lifecycle events, subscriptions,
// and message payloads to your server console`}</code>
                </pre>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-sm font-semibold text-slate-200 mb-2">Check Connection State</p>
                <pre className="bg-slate-900 rounded-lg p-3">
                  <code className="text-xs text-slate-300">{`// Monitor connection state
setInterval(() => {
  console.log('WebSocket state:', ws.readyState);
  console.log('Buffered amount:', ws.bufferedAmount);

  if (ws.readyState !== WebSocket.OPEN) {
    console.warn('Connection not open!');
  }
}, 5000);`}</code>
                </pre>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-sm font-semibold text-slate-200 mb-2">Verify Subscription</p>
                <pre className="bg-slate-900 rounded-lg p-3">
                  <code className="text-xs text-slate-300">{`// Check if subscription was successful
ws.send(JSON.stringify({
  event: 'phx_join',
  topic: 'project_id:table_name',
  payload: { token: 'YOUR_JWT_TOKEN' },
  ref: 'debug_1'
}));

// Should receive phx_reply with status: 'ok'
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.ref === 'debug_1') {
    console.log('Subscription result:', msg.payload);
  }
};`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Getting Help */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Still Having Issues?
            </h3>
            <div className="space-y-3">
              <ul className="text-sm text-blue-200/80 space-y-1">
                <li>• Check the <a href="/docs/infrastructure" className="text-emerald-400 hover:underline">Infrastructure documentation</a> for system status</li>
                <li>• Review <a href="/docs" className="text-emerald-400 hover:underline">API documentation</a> for error codes</li>
                <li>• Enable debug logging and capture error messages</li>
                <li>• Check the <a href="https://github.com/nextmavens" className="text-emerald-400 hover:underline">GitHub issues</a> for similar problems</li>
              </ul>
              <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-2">Need Support?</p>
                <p className="text-sm text-slate-300">
                  Contact us at <a href="mailto:support@nextmavens.cloud" className="text-emerald-400 hover:underline">support@nextmavens.cloud</a> with:
                </p>
                <ul className="text-xs text-slate-400 mt-2 space-y-1">
                  <li>Project ID and name</li>
                  <li>Error messages or codes</li>
                 >                  <li>Steps to reproduce</li>
                  <li>Browser and environment details</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Examples */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">Examples</h2>

          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-slate-300 text-lg leading-relaxed mb-4">
              Explore working examples demonstrating common realtime patterns. These examples show how to build collaborative
              features, live notifications, and real-time data synchronization.
            </p>
          </div>

          {/* Example Apps */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" />
              Example Applications
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Explore complete example applications demonstrating realtime features:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <a
                href="https://github.com/nextmavens/examples/tree/main/realtime-collaborative-editor"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-colors"
              >
                <FileCode className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-100 mb-1">Collaborative Editor</h4>
                  <p className="text-sm text-slate-400">Real-time document editing with presence and cursors</p>
                </div>
              </a>
              <a
                href="https://github.com/nextmavens/examples/tree/main/realtime-live-chat"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-colors"
              >
                <FileCode className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-100 mb-1">Live Chat</h4>
                  <p className="text-sm text-slate-400">Real-time messaging with typing indicators</p>
                </div>
              </a>
              <a
                href="https://github.com/nextmavens/examples/tree/main/realtime-live-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-colors"
              >
                <FileCode className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-100 mb-1">Live Dashboard</h4>
                  <p className="text-sm text-slate-400">Real-time metrics and analytics visualization</p>
                </div>
              </a>
              <a
                href="https://github.com/nextmavens/examples/tree/main/realtime-multiplayer-game"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-colors"
              >
                <FileCode className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-100 mb-1">Multiplayer Game</h4>
                  <p className="text-sm text-slate-400">Real-time player movement and game state sync</p>
                </div>
              </a>
            </div>
          </div>

          {/* Live Demo */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Live Demo
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Try out the realtime features in our interactive demo:
            </p>
            <a
              href="https://demo.nextmavens.cloud/realtime"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              Launch Live Demo
            </a>
            <p className="text-xs text-slate-500 mt-2">
              Features: Real-time data updates, presence tracking, live cursors, and broadcast messaging
            </p>
          </div>

          {/* Code Examples - Collaborative Editing */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-400" />
              Collaborative Editing Example
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Build a collaborative document editor with real-time cursors and presence:
            </p>
            <pre className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300">{`// Collaborative Document Editor with Realtime
class CollaborativeEditor {
  constructor(projectId, documentId, token) {
    this.ws = new WebSocket(\`wss://realtime.nextmavens.cloud?token=\${token}\`);
    this.documentId = documentId;
    this.cursors = new Map(); // Track other users' cursors
    this.content = '';
    this.userId = this.extractUserId(token);
    this.userName = 'Anonymous';

    this.setupSubscriptions();
    this.setupPresence();
  }

  setupSubscriptions() {
    // Subscribe to document changes
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        event: 'phx_join',
        topic: \`\${projectId}:document_edits\`,
        payload: {
          token: 'YOUR_JWT_TOKEN',
          config: {
            events: ['INSERT', 'UPDATE'],
            filter: \`document_id=eq.\${this.documentId}\`
          }
        },
        ref: '1'
      }));
    };

    // Handle content changes
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.event === 'INSERT' || msg.event === 'UPDATE') {
        const { record, old_record } = msg.payload;
        if (record.document_id === this.documentId) {
          this.applyRemoteChange(record, old_record);
        }
      }
    };
  }

  setupPresence() {
    // Join presence channel for cursors
    this.ws.send(JSON.stringify({
      event: 'phx_join',
      topic: \`presence:document_\${this.documentId}\`,
      payload: {
        token: 'YOUR_JWT_TOKEN',
        user_id: this.userId,
        user_metadata: {
          name: this.userName,
          color: this.getRandomColor()
        }
      },
      ref: '2'
    }));

    // Track other users' cursors
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);

      if (msg.event === 'presence_state') {
        // Initial sync of all users
        Object.entries(msg.payload).forEach(([userId, userData]) => {
          this.showCursor(userId, userData);
        });
      }

      if (msg.event === 'presence_diff') {
        const { joins, leaves } = msg.payload;

        Object.keys(joins).forEach(userId => {
          this.showCursor(userId, joins[userId]);
        });

        Object.keys(leaves).forEach(userId => {
          this.removeCursor(userId);
        });
      }

      if (msg.event === 'presence_update') {
        const { user_id, state } = msg.payload;
        if (state.cursor) {
          this.updateCursor(user_id, state.cursor);
        }
      }
    });
  }

  // Local user is typing - broadcast cursor position
  broadcastCursor(position) {
    this.ws.send(JSON.stringify({
      event: 'presence_update',
      topic: \`presence:document_\${this.documentId}\`,
      payload: {
        token: 'YOUR_JWT_TOKEN',
        user_id: this.userId,
        state: {
          cursor: position,
          last_updated: new Date().toISOString()
        }
      },
      ref: String(Date.now())
    }));
  }

  // Apply remote content change
  applyRemoteChange(record, oldRecord) {
    // Operational Transformation or CRDT logic here
    // For simplicity, we'll just update the content
    if (record.type === 'text_insert') {
      this.content = this.content.slice(0, record.position) +
                    record.text +
                    this.content.slice(record.position);
    } else if (record.type === 'text_delete') {
      this.content = this.content.slice(0, record.position) +
                    this.content.slice(record.position + record.length);
    }

    this.render();
  }

  // Save local change to database
  async saveChange(changeType, position, text, length) {
    await fetch(\`/api/v1/document_edits\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${this.token}\`
      },
      body: JSON.stringify({
        document_id: this.documentId,
        type: changeType,
        position,
        text,
        length
      })
    });
  }

  // Show cursor for another user
  showCursor(userId, userData) {
    const cursor = document.createElement('div');
    cursor.className = 'remote-cursor';
    cursor.style.cssText = \`
      position: absolute;
      border-left: 2px solid \${userData.user_metadata.color};
      height: 20px;
      pointer-events: none;
      transition: all 0.1s ease-out;
    \`;

    const label = document.createElement('div');
    label.className = 'cursor-label';
    label.textContent = userData.user_metadata.name;
    label.style.cssText = \`
      position: absolute;
      top: -20px;
      left: 0;
      background: \${userData.user_metadata.color};
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      white-space: nowrap;
    \`;

    cursor.appendChild(label);
    document.getElementById('editor-container').appendChild(cursor);
    this.cursors.set(userId, cursor);
  }

  updateCursor(userId, position) {
    const cursor = this.cursors.get(userId);
    if (cursor) {
      cursor.style.left = \`\${position.x}px\`;
      cursor.style.top = \`\${position.y}px\`;
    }
  }

  removeCursor(userId) {
    const cursor = this.cursors.get(userId);
    if (cursor) {
      cursor.remove();
      this.cursors.delete(userId);
    }
  }

  getRandomColor() {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  extractUserId(token) {
    // Parse JWT to extract user_id
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id;
  }

  render() {
    document.getElementById('editor-content').textContent = this.content;
  }
}

// Initialize the collaborative editor
const editor = new CollaborativeEditor(
  'abc123xyz',
  'doc_456',
  'YOUR_JWT_TOKEN'
);

// Broadcast cursor position on user input
document.getElementById('editor-textarea').addEventListener('input', (e) => {
  const selection = e.target.selectionStart;
  const rect = getCaretCoordinates(e.target, selection);
  editor.broadcastCursor({ x: rect.left, y: rect.top });

  // Save changes to database
  editor.saveChange('text_insert', selection, e.target.value, 0);
});`}</code>
            </pre>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-xs text-emerald-300 mb-1">Database Events</p>
                <p className="text-sm font-semibold text-emerald-200">Content sync</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300 mb-1">Presence</p>
                <p className="text-sm font-semibold text-blue-200">Cursor tracking</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-xs text-purple-300 mb-1">Real-time</p>
                <p className="text-sm font-semibold text-purple-200">Multi-user editing</p>
              </div>
            </div>
          </div>

          {/* Code Examples - Live Notifications */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-orange-400" />
              Live Notifications Example
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Implement real-time notifications that appear instantly when events occur:
            </p>
            <pre className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300">{`// Real-time Notifications System
class NotificationManager {
  constructor(projectId, token) {
    this.ws = new WebSocket(\`wss://realtime.nextmavens.cloud?token=\${token}\`);
    this.notifications = [];
    this.setupListeners();
  }

  setupListeners() {
    this.ws.onopen = () => {
      // Subscribe to notifications for this user
      this.ws.send(JSON.stringify({
        event: 'phx_join',
        topic: \`\${projectId}:notifications\`,
        payload: {
          token: 'YOUR_JWT_TOKEN',
          config: {
            events: ['INSERT'],
            filter: \`user_id=eq.\${this.getCurrentUserId()}\`
          }
        },
        ref: '1'
      }));
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.event === 'INSERT') {
        const notification = msg.payload.record;
        this.showNotification(notification);
        this.notifications.push(notification);
      }
    };
  }

  showNotification(notification) {
    // Create notification element
    const container = document.getElementById('notifications-container');

    const notificationEl = document.createElement('div');
    notificationEl.className = 'notification-slide-in';
    notificationEl.style.cssText = \`
      background: \${this.getNotificationColor(notification.type)};
      border-left: 4px solid;
      padding: 16px;
      margin-bottom: 8px;
      border-radius: 4px;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    \`;

    notificationEl.innerHTML = \`
      <div class="flex items-start gap-3">
        <div class="notification-icon">
          \${this.getNotificationIcon(notification.type)}
        </div>
        <div class="flex-1">
          <p class="font-semibold text-white">\${notification.title}</p>
          <p class="text-sm text-white/80">\${notification.message}</p>
          \${notification.action_url ? \`<a href="\${notification.action_url}"
            class="inline-block mt-2 text-sm underline">View Details</a>\` : ''}
        </div>
        <button onclick="this.parentElement.parentElement.remove()"
          class="text-white/60 hover:text-white">&times;</button>
      </div>
    \`;

    container.appendChild(notificationEl);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notificationEl.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notificationEl.remove(), 300);
    }, 5000);

    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192.png',
        tag: notification.id
      });
    }
  }

  getNotificationColor(type) {
    const colors = {
      info: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      success: 'linear-gradient(135deg, #10b981, #059669)',
      warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
      error: 'linear-gradient(135deg, #ef4444, #dc2626)',
      mention: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      system: 'linear-gradient(135deg, #6b7280, #4b5563)'
    };
    return colors[type] || colors.info;
  }

  getNotificationIcon(type) {
    const icons = {
      info: '<svg class="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      success: '<svg class="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      warning: '<svg class="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
      error: '<svg class="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      mention: '<svg class="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>',
      system: '<svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>'
    };
    return icons[type] || icons.info;
  }

  getCurrentUserId() {
    // Extract user_id from your auth context
    const token = localStorage.getItem('jwt_token');
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id;
  }
}

// Request browser notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Initialize notification manager
const notificationManager = new NotificationManager(
  'abc123xyz',
  'YOUR_JWT_TOKEN'
);

// Server-side: Create a notification (triggers realtime event)
async function createNotification(userId, title, message, type = 'info', actionUrl = null) {
  const response = await fetch('/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${getAuthToken()}\`
    },
    body: JSON.stringify({
      user_id: userId,
      title,
      message,
      type,
      action_url: actionUrl
    })
  });

  return response.json();
}

// Example usage: Send a notification when someone mentions a user
async function notifyUserMention(mentionedUserId, mentioningUserName, content) {
  await createNotification(
    mentionedUserId,
    \`@\${mentioningUserName} mentioned you\`,
    content.substring(0, 100) + (content.length > 100 ? '...' : ''),
    'mention',
    '/messages'
  );
}`}</code>
            </pre>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-xs text-emerald-300 mb-1">INSERT Events</p>
                <p className="text-sm font-semibold text-emerald-200">Instant delivery</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300 mb-1">Browser API</p>
                <p className="text-sm font-semibold text-blue-200">Native notifications</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-xs text-purple-300 mb-1">Auto-dismiss</p>
                <p className="text-sm font-semibold text-purple-200">5-second timeout</p>
              </div>
            </div>
          </div>

          {/* Common Patterns */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              Common Realtime Patterns
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="font-semibold text-slate-100 mb-2">Live Score Updates</h4>
                <p className="text-sm text-slate-400 mb-3">
                  Subscribe to game scores table for instant updates
                </p>
                <pre className="bg-slate-900 rounded p-2">
                  <code className="text-xs text-slate-300">{`{
  topic: 'abc123xyz:game_scores',
  payload: {
    config: {
      events: ['UPDATE'],
      filter: 'game_id=eq.123'
    }
  }
}`}</code>
                </pre>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="font-semibold text-slate-100 mb-2">Stock Price Ticker</h4>
                <p className="text-sm text-slate-400 mb-3">
                  Real-time price updates from market data
                </p>
                <pre className="bg-slate-900 rounded p-2">
                  <code className="text-xs text-slate-300">{`{
  topic: 'abc123xyz:stock_prices',
  payload: {
    config: {
      events: ['UPDATE'],
      filter: 'symbol=in.AAPL,GOO,MSFT'
    }
  }
}`}</code>
                </pre>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="font-semibold text-slate-100 mb-2">Auction Bidding</h4>
                <p className="text-sm text-slate-400 mb-3">
                  Track new bids in real-time auctions
                </p>
                <pre className="bg-slate-900 rounded p-2">
                  <code className="text-xs text-slate-300">{`{
  topic: 'abc123xyz:auction_bids',
  payload: {
    config: {
      events: ['INSERT'],
      filter: 'auction_id=eq.456'
    }
  }
}`}</code>
                </pre>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="font-semibold text-slate-100 mb-2">Activity Feed</h4>
                <p className="text-sm text-slate-400 mb-3">
                  Social feed with new posts and interactions
                </p>
                <pre className="bg-slate-900 rounded p-2">
                  <code className="text-xs text-slate-300">{`{
  topic: 'abc123xyz:activities',
  payload: {
    config: {
      events: ['INSERT'],
      filter: 'user_id=in.friends'
    }
  }
}`}</code>
                </pre>
              </div>
            </div>
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
