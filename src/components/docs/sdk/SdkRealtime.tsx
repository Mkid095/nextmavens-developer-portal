'use client'

import { motion } from 'framer-motion'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

const realtimeExamples = [
  {
    title: 'Connect to Realtime',
    description: 'Establish a WebSocket connection to the realtime service',
    code: `const token = localStorage.getItem('accessToken');
const ws = new WebSocket(\`wss://api.nextmavens.cloud/realtime?token=\${token}\`);

ws.onopen = () => {
  console.log('Connected to Realtime!');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from Realtime');
};`,
  },
  {
    title: 'Subscribe to Channel',
    description: 'Subscribe to a database change channel',
    code: `// After connecting, subscribe to a channel
ws.onopen = () => {
  ws.send(JSON.stringify({
    event: 'phx_join',
    topic: 'realtime:users',
    payload: { token },
    ref: '1'
  }));
};

// Handle incoming messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.event === 'INSERT') {
    console.log('New record:', message.payload.new);
  } else if (message.event === 'UPDATE') {
    console.log('Updated record:', message.payload.new);
  } else if (message.event === 'DELETE') {
    console.log('Deleted record:', message.payload.old);
  }
};`,
  },
  {
    title: 'React Hook Example',
    description: 'Use realtime in a React component with automatic cleanup',
    code: `import { useEffect, useState } from 'react';

export function useRealtime(channelName: string) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const ws = new WebSocket(\`wss://api.nextmavens.cloud/realtime?token=\${token}\`);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        event: 'phx_join',
        topic: channelName,
        payload: { token },
        ref: '1'
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };

    return () => {
      ws.close();
    };
  }, [channelName]);

  return messages;
}`,
  },
  {
    title: 'Error Handling',
    description: 'Handle common realtime errors and implement reconnection',
    code: `let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connectRealtime() {
  const token = localStorage.getItem('accessToken');
  const ws = new WebSocket(\`wss://api.nextmavens.cloud/realtime?token=\${token}\`);

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('Connection closed');

    // Attempt to reconnect
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = Math.pow(2, reconnectAttempts) * 1000; // Exponential backoff
      setTimeout(connectRealtime, delay);
    }
  };

  ws.onopen = () => {
    reconnectAttempts = 0; // Reset on successful connection
  };

  return ws;
}

const ws = connectRealtime();`,
  },
]

export function SdkRealtime() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Realtime Subscriptions</h2>
      <p className="text-slate-600 mb-6">
        Use WebSocket to connect to the realtime service and receive live database updates.
      </p>
      <div className="space-y-6 mb-12">
        {realtimeExamples.map((example, index) => (
          <motion.div
            key={example.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-1">{example.title}</h3>
              <p className="text-slate-600">{example.description}</p>
            </div>
            <div className="p-6">
              <CodeBlockWithCopy>{example.code}</CodeBlockWithCopy>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
