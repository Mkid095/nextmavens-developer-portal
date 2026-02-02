/**
 * Troubleshooting Section
 *
 * Common issues and solutions for MCP server setup and usage.
 */

'use client'

import { motion } from 'framer-motion'
import { Github } from 'lucide-react'
import { CodeBlock } from '../ui'
import type { TroubleshootingItem } from '../../types'

const troubleshootingItems: TroubleshootingItem[] = [
  {
    title: 'Server not starting',
    solution: 'Make sure you have set the NEXTMAVENS_API_KEY environment variable before starting the server.',
    code: 'export NEXTMAVENS_API_KEY=nm_live_pk_your_key_here'
  },
  {
    title: 'Tools not appearing in Claude Code',
    solution: 'Run `claude mcp list` to verify the server is configured. Try removing and re-adding the server.',
    code: 'claude mcp remove nextmavens\nclaude mcp add --transport http nextmavens https://api.nextmavens.cloud/mcp'
  },
  {
    title: 'Authentication errors',
    solution: 'Verify your API key is valid and has the correct permissions. Get a new key from the dashboard if needed.',
    code: ''
  },
  {
    title: 'Network connection issues',
    solution: 'Check that the MCP server is running on the correct port (default: 3000). Verify the URL in your configuration.',
    code: 'curl https://api.nextmavens.cloud/mcp'
  },
]

export function TroubleshootingSection() {
  return (
    <motion.div
      key="troubleshooting"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className="text-3xl font-semibold text-slate-900 mb-6">Troubleshooting</h1>

      <div className="space-y-6">
        {troubleshootingItems.map((item, i) => (
          <TroubleshootingCard key={i} item={item} />
        ))}

        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
          <h3 className="text-lg font-semibold text-emerald-900 mb-2">Still need help?</h3>
          <p className="text-emerald-700 mb-4">
            Check out the GitHub repository or create an issue for more support.
          </p>
          <a
            href="https://github.com/Mkid095/nextmavens-mcp-server/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium"
          >
            <Github className="w-4 h-4" />
            View Issues on GitHub
          </a>
        </div>
      </div>
    </motion.div>
  )
}

interface TroubleshootingCardProps {
  item: TroubleshootingItem
}

function TroubleshootingCard({ item }: TroubleshootingCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
      <p className="text-slate-600 mb-4">{item.solution}</p>
      {item.code && <CodeBlock code={item.code} />}
    </div>
  )
}
