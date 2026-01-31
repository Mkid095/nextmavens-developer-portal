'use client'

import { motion } from 'framer-motion'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

const installMethods = [
  {
    name: 'Direct API',
    description: 'Use the REST API directly with fetch or any HTTP client',
    url: 'https://api.nextmavens.cloud',
  },
  {
    name: 'GraphQL',
    description: 'Query using GraphQL endpoint with Apollo, urql, or fetch',
    url: 'https://api.nextmavens.cloud/graphql',
  },
  {
    name: 'Realtime',
    description: 'Connect via WebSocket for live data updates',
    url: 'wss://api.nextmavens.cloud/realtime',
  },
]

export function SdkInstall() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-8 border border-slate-200 mb-12"
    >
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Getting Started</h2>
      <p className="text-slate-600 mb-6">
        The NextMavens API provides direct access to all services. No SDK installation required - use standard
        HTTP clients or GraphQL libraries to interact with the API.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {installMethods.map((method) => (
          <div key={method.name} className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-900 mb-2">{method.name}</p>
            <p className="text-xs text-slate-600 mb-3">{method.description}</p>
            <code className="text-xs text-blue-700 break-all">{method.url}</code>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-900 mb-2">Quick Start Example</h3>
        <CodeBlockWithCopy>{`// Using fetch with the REST API
const response = await fetch('https://api.nextmavens.cloud/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'your-password'
  })
});

const { data } = await response.json();`}</CodeBlockWithCopy>
      </div>
    </motion.div>
  )
}
