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
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Initialization</h2>
      <p className="text-slate-600 mb-6">
        Create a client instance with your API credentials:
      </p>
      <CodeBlockWithCopy>{`import { createClient } from 'nextmavens-js'

const client = createClient({
  apiKey: process.env.NEXTMAVENS_API_KEY,
  apiUrl: 'https://api.nextmavens.cloud',
  authUrl: 'https://auth.nextmavens.cloud'
})`}</CodeBlockWithCopy>

      <h3 className="text-lg font-semibold text-slate-900 mt-8 mb-4">Environment Variables</h3>
      <p className="text-slate-600 mb-4">
        Store your credentials in environment variables for security:
      </p>
      <CodeBlockWithCopy>{`# .env.local
NEXTMAVENS_API_KEY=your_api_key_here
NEXTMAVENS_PROJECT_ID=your_project_id`}</CodeBlockWithCopy>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-amber-900">
          <strong>Security Note:</strong> Never commit your API keys to version control. Always use environment variables.
        </p>
      </div>
    </motion.div>
  )
}
