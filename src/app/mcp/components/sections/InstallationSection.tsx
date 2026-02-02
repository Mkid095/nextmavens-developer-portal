/**
 * Installation Section
 *
 * Installation guide for the MCP server.
 */

'use client'

import { motion } from 'framer-motion'
import { Github, Code2 } from 'lucide-react'
import { CodeBlock } from '../ui'

export function InstallationSection() {
  return (
    <>
      <motion.div
        key="installation"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <h1 className="text-3xl font-semibold text-slate-900 mb-6">Installation Guide</h1>

        {/* GitHub Installation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-900 rounded-xl">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">GitHub Installation</h2>
              <p className="text-sm text-slate-600">Clone and run the MCP server locally</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                1. Clone the repository
              </label>
              <CodeBlock code="git clone https://github.com/Mkid095/nextmavens-mcp-server.git" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                2. Navigate and install dependencies
              </label>
              <CodeBlock code={`cd nextmavens-mcp-server
npm install`} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                3. Set your API key
              </label>
              <CodeBlock code={`export NEXTMAVENS_API_KEY=nm_live_pk_your_key_here`} />
              <p className="text-sm text-slate-500 mt-2">
                Get your API key from the{' '}
                <a href="/dashboard" className="text-emerald-700 hover:text-emerald-800 font-medium">
                  dashboard
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                4. Start the server
              </label>
              <CodeBlock code="npm start" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Configuration Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 gap-8 mb-12"
      >
        {/* Claude Code */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Claude Code</h3>
              <p className="text-sm text-slate-600">Desktop CLI</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Add MCP Server
              </label>
              <CodeBlock code={`claude mcp add --transport http nextmavens \\
  --url https://api.nextmavens.cloud/mcp \\
  --header "Authorization: Bearer $NEXTMAVENS_API_KEY"`} />
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-700">
                <strong>Tip:</strong> Use the <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">--scope</code> flag to share with your team via <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">.mcp.json</code>
              </p>
            </div>
          </div>
        </div>

        {/* Cursor */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Cursor</h2>
              <p className="text-sm text-slate-600">Configure via mcp.json file</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Create .cursor/mcp.json
              </label>
              <CodeBlock code={`{
  "mcpServers": {
    "nextmavens": {
      "type": "http",
      "url": "https://api.nextmavens.cloud/mcp",
      "headers": {
        "Authorization": "Bearer \${env:NEXTMAVENS_API_KEY}"
      }
    }
  }
}`} />
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Environment Variables</h4>
              <p className="text-sm text-slate-600 mb-2">
                Set your API key as an environment variable:
              </p>
              <CodeBlock code="export NEXTMAVENS_API_KEY=nm_live_pk_your_key_here" />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
