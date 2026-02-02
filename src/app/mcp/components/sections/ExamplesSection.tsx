/**
 * Examples Section
 *
 * Shows example conversations between users and AI assistants using NextMavens tools.
 */

'use client'

import { motion } from 'framer-motion'
import type { Example } from '../../types'

const examples: Example[] = [
  {
    user: 'Show me all users created in the last 7 days',
    ai: 'nextmavens_query',
    desc: 'called with filters for created_at > 7 days ago'
  },
  {
    user: 'Create a new user with email john@example.com',
    ai: 'nextmavens_signup',
    desc: 'called with email, generating secure password'
  },
  {
    user: 'What tables exist in my database?',
    ai: 'nextmavens_graphql_introspect',
    desc: 'called to retrieve schema information'
  },
  {
    user: 'Get me the download URL for file 12345',
    ai: 'nextmavens_file_download_url',
    desc: 'generating temporary download link'
  },
]

export function ExamplesSection() {
  return (
    <motion.div
      key="examples"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className="text-3xl font-semibold text-slate-900 mb-6">Example Conversations</h1>
      <p className="text-slate-600 mb-8">See how AI assistants can use NextMavens tools</p>

      <div className="space-y-6">
        {examples.map((example, i) => (
          <ExampleCard key={i} example={example} />
        ))}
      </div>
    </motion.div>
  )
}

interface ExampleCardProps {
  example: Example
}

function ExampleCard({ example }: ExampleCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">Y</span>
        </div>
        <div className="flex-1">
          <p className="text-slate-900">{example.user}</p>
        </div>
      </div>
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-700">
            <span className="font-mono text-emerald-700">{example.ai}</span> {example.desc}...
          </p>
        </div>
      </div>
    </div>
  )
}
