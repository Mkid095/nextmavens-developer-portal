'use client';

import { motion } from 'framer-motion';
import { Radio, RefreshCw, Clock, Power, Zap } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function RealtimeConnectionLifecycle() {
  return (
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
const ws = new WebSocket('wss://api.nextmavens.cloud/realtime?token=YOUR_JWT');

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
  'wss://api.nextmavens.cloud/realtime',
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
          <code className="text-sm text-slate-300">{`const ws = new WebSocket('wss://api.nextmavens.cloud/realtime?token=YOUR_JWT');
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
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Power className="w-5 h-5 text-red-400" />
          Graceful Shutdown
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Properly close connections to avoid resource leaks and ensure data integrity:
        </p>
        <pre className="bg-slate-900 rounded-lg p-4">
          <code className="text-sm text-slate-300">{`const ws = new WebSocket('wss://api.nextmavens.cloud/realtime?token=YOUR_JWT');

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
    </motion.div>
  );
}
