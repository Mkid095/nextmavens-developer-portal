'use client'

import { motion } from 'framer-motion'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

const realtimeExamples = [
  {
    title: 'Subscribe to Changes',
    description: 'Listen to real-time database changes',
    code: `// Subscribe to INSERT events on a table
const channel = client
  .channel('custom-channel')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'users',
      filter: 'status=eq.active'
    },
    (payload) => {
      console.log('New user:', payload.new)
    }
  )
  .subscribe()

// Subscribe to all events (INSERT, UPDATE, DELETE)
const allChanges = client
  .channel('all-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders'
    },
    (payload) => {
      console.log('Order changed:', payload)
    }
  )
  .subscribe()`,
  },
  {
    title: 'Broadcast Messages',
    description: 'Send and receive broadcast messages',
    code: `// Send broadcast messages
const channel = client.channel('chat-room')

// Subscribe to broadcast events
channel
  .on('broadcast', { event: 'message' }, (payload) => {
    console.log('Received:', payload.payload)
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      // Send a message to all subscribers
      channel.send({
        type: 'broadcast',
        event: 'message',
        payload: { text: 'Hello everyone!' }
      })
    }
  })`,
  },
  {
    title: 'Presence Tracking',
    description: 'Track online users and their state',
    code: `const channel = client.channel('online-users')

// Track presence
channel
  .on('presence', { event: 'sync' }, () => {
    const newState = channel.presenceState()
    console.log('Online users:', newState)
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', key, newPresences)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', key, leftPresences)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      // Track current user state
      await channel.track({
        user_id: 1,
        online_at: new Date().toISOString()
      })
    }
  })`,
  },
  {
    title: 'Unsubscribe from Channel',
    description: 'Clean up subscriptions when done',
    code: `const channel = client.channel('my-channel')

// ... subscribe and use the channel

// Unsubscribe when done
channel.unsubscribe()

// Or remove all listeners and close
client.removeChannel(channel)

// Cleanup on component unmount
useEffect(() => {
  const channel = client.channel('my-channel')
  channel.subscribe()

  return () => {
    channel.unsubscribe()
  }
}, [])`,
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
