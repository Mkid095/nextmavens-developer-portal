'use client'

import { motion } from 'framer-motion'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

export function SdkInitialization() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl p-8 border border-slate-200 mb-12"
    >
      <h2 className="text-xl font-semibold text-slate-900 mb-6">API Authentication</h2>
      <p className="text-slate-600 mb-6">
        To use the NextMavens API, you need an API key. Create one in the dashboard and include it in your requests.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 mb-4">Environment Variables</h3>
      <p className="text-slate-600 mb-4">
        Store your credentials in environment variables for security:
      </p>
      <CodeBlockWithCopy>{`# .env.local
NEXTMAVENS_API_KEY=your_api_key_here
NEXTMAVENS_API_URL=https://api.nextmavens.cloud`}</CodeBlockWithCopy>

      <h3 className="text-lg font-semibold text-slate-900 mt-8 mb-4">Making Authenticated Requests</h3>
      <CodeBlockWithCopy>{`// Using fetch with Authorization header
const response = await fetch(`${process.env.NEXTMAVENS_API_URL}/api/users`, {
  headers: {
    'Authorization': `Bearer ${process.env.NEXTMAVENS_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

const { data } = await response.json();`}</CodeBlockWithCopy>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-amber-900">
          <strong>Security Note:</strong> Never commit your API keys to version control. Always use environment variables
          and never expose keys in client-side code.
        </p>
      </div>
    </motion.div>
  )
}
