'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Shield, Code2, AlertTriangle, CheckCircle, Zap, Server, Key, Lock, Globe, Terminal, Database, Cloud, FolderTree, Folder, Clock } from 'lucide-react'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'
import {
  ToolCategory,
  TokenTypes,
  SetupInstructions,
  McpServiceInfo,
  CompatibleAITools,
  ScopeReferenceTable,
} from './components'
import { mcpConfig, mcpTools } from './constants'

export default function MCPDocsPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif'; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1400px] px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Home</Link>
            <Link href="/docs" className="text-sm text-slate-900 font-medium">Docs</Link>
            <Link href="/mcp" className="text-sm text-slate-600 hover:text-slate-900">MCP</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1400px] px-4 py-12">
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-teal-100 rounded-xl">
            <Zap className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">MCP Integration</h1>
            <p className="text-slate-600">
              Model Context Protocol server v{mcpConfig.version} for AI/IDE integration with {mcpConfig.toolsCount} tools
            </p>
          </div>
        </div>

        {/* Service Info */}
        <McpServiceInfo />

        {/* MCP Tools by Category */}
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Available Tools</h2>
        <div className="space-y-6 mb-12">
          {mcpTools.map((category) => (
            <ToolCategory key={category.category} category={category} />
          ))}
        </div>

        {/* Token Types */}
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">MCP Token Types</h2>
        <TokenTypes colorClasses={{
          emerald: 'bg-emerald-50 border-emerald-200',
          amber: 'bg-amber-50 border-amber-200',
          red: 'bg-red-50 border-red-200'
        }} />

        {/* Setup Instructions */}
        <SetupInstructions />

        {/* Request/Response Format */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Request/Response Format</h2>

          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">MCP Request</h3>
            <CodeBlockWithCopy>{`// MCP JSON-RPC 2.0 format
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "nextmavens_query",
    "arguments": {
      "table": "users",
      "filters": [
        { "column": "email", "operator": "eq", "value": "user@example.com" }
      ],
      "limit": 10
    }
  }
}`}</CodeBlockWithCopy>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3">MCP Response</h3>
            <CodeBlockWithCopy>{`{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\\"table\\":\\"users\\",\\"count\\":1,\\"data\\":[...]}"
      }
    ]
  }
}`}</CodeBlockWithCopy>
          </div>
        </div>

        {/* AI Tool Compatibility */}
        <CompatibleAITools />

        {/* Security */}
        <div className="bg-amber-50 rounded-xl p-8 border border-amber-200 mb-12 mt-12">
          <h2 className="text-xl font-semibold text-amber-900 mb-4">
            <AlertTriangle className="w-5 h-5 inline mr-2" />
            Security Considerations
          </h2>
          <div className="space-y-3 text-amber-900">
            <p className="text-sm">
              <strong>MCP tokens have access to your production database.</strong> Only grant permissions
              that the AI tool needs for its task.
            </p>
            <ul className="text-sm space-y-1">
              <li>• Use <code className="bg-white px-1 rounded">mcp_ro_</code> tokens for read-only AI assistants</li>
              <li>• Never share MCP tokens in public code or chat logs</li>
              <li>• Monitor audit logs for AI tool activity</li>
              <li>• Rotate MCP tokens regularly</li>
              <li>• Set expiration dates on all MCP tokens</li>
            </ul>
          </div>
        </div>

        {/* Scope Reference Table */}
        <ScopeReferenceTable />

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/api-keys" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            API Keys Docs
          </Link>
          <Link href="/docs/graphql" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
            GraphQL Docs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
