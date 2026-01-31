'use client';

import { motion } from 'framer-motion';
import { Radio, Shield, Zap, Database } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function RealtimeWebSocket() {
  return (
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
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-slate-400 mb-2">Production (via API Gateway):</p>
            <pre className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300">wss://api.nextmavens.cloud/realtime</code>
            </pre>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Local Development:</p>
            <pre className="bg-slate-900 rounded-lg p-4">
              <code className="text-sm text-slate-300">ws://localhost:4003/realtime</code>
            </pre>
          </div>
        </div>
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
const ws = new WebSocket(\`wss://api.nextmavens.cloud/realtime?token=YOUR_JWT_TOKEN\`)

// Or via subprotocol
const ws = new WebSocket('wss://api.nextmavens.cloud/realtime', ['your_jwt_token'])`}</code>
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
const ws = new WebSocket(\`wss://api.nextmavens.cloud/realtime?token=\${token}\`);

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
REALTIME_URL = 'wss://api.nextmavens.cloud/realtime'

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
  );
}
