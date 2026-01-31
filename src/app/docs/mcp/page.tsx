'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Shield, Code2, AlertTriangle, CheckCircle, Zap, Server, Key, Lock, Globe, Terminal } from 'lucide-react'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

const mcpConfig = {
  gatewayDomain: 'https://api.nextmavens.cloud',
  endpoint: '/mcp',
  available: true,
  protocol: 'MCP (Model Context Protocol) 2024-11-05',
  toolsCount: 11,
}

const mcpTools = [
  {
    category: 'Database Operations',
    tools: [
      {
        name: 'nextmavens_query',
        description: 'Execute SELECT queries on any database table',
        parameters: 'table, filters, limit, offset, orderBy',
        scopes: ['db:select'],
      },
      {
        name: 'nextmavens_insert',
        description: 'Insert new records into a table',
        parameters: 'table, data',
        scopes: ['db:insert'],
      },
      {
        name: 'nextmavens_update',
        description: 'Update existing records in a table',
        parameters: 'table, data, filters',
        scopes: ['db:update'],
      },
      {
        name: 'nextmavens_delete',
        description: 'Delete records from a table',
        parameters: 'table, filters',
        scopes: ['db:delete'],
      },
    ],
  },
  {
    category: 'Authentication',
    tools: [
      {
        name: 'nextmavens_signin',
        description: 'Sign in a user with email and password',
        parameters: 'email, password',
        scopes: ['auth:signin'],
      },
      {
        name: 'nextmavens_signup',
        description: 'Sign up a new user',
        parameters: 'email, password, name, tenantId',
        scopes: ['auth:signup'],
      },
    ],
  },
  {
    category: 'Storage (Telegram)',
    tools: [
      {
        name: 'nextmavens_file_info',
        description: 'Get information about a file by ID',
        parameters: 'fileId',
        scopes: ['storage:read'],
      },
      {
        name: 'nextmavens_file_download_url',
        description: 'Get a download URL for a file',
        parameters: 'fileId',
        scopes: ['storage:read'],
      },
      {
        name: 'nextmavens_list_files',
        description: 'List files with optional filters',
        parameters: 'tenantId, fileType, limit, offset',
        scopes: ['storage:read'],
      },
    ],
  },
  {
    category: 'GraphQL',
    tools: [
      {
        name: 'nextmavens_graphql',
        description: 'Execute a GraphQL query',
        parameters: 'query, variables',
        scopes: ['graphql:execute'],
      },
      {
        name: 'nextmavens_graphql_introspect',
        description: 'Get GraphQL schema introspection',
        parameters: 'none (automatic)',
        scopes: ['graphql:execute'],
      },
    ],
  },
]

const tokenTypes = [
  {
    type: 'mcp_ro_',
    name: 'MCP Read-Only',
    color: 'emerald',
    scopes: ['db:select', 'storage:read', 'graphql:execute'],
    description: 'Safe for most AI tools - read database access only',
  },
  {
    type: 'mcp_rw_',
    name: 'MCP Read-Write',
    color: 'amber',
    scopes: ['db:select', 'db:insert', 'db:update', 'storage:read', 'storage:write', 'graphql:execute'],
    description: 'For trusted AI tools - can modify data',
  },
  {
    type: 'mcp_admin_',
    name: 'MCP Admin',
    color: 'red',
    scopes: ['db:select', 'db:insert', 'db:update', 'db:delete', 'storage:read', 'storage:write', 'auth:manage'],
    description: 'Full access - bypasses RLS - use with extreme caution',
  },
]

export default function MCPDocsPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif; }
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
            <p className="text-slate-600">Model Context Protocol for AI/IDE integration with {mcpConfig.toolsCount} tools</p>
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-12">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">MCP Server Information</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Endpoint</span>
              </div>
              <code className="text-xs text-blue-700 break-all">{mcpConfig.gatewayDomain}{mcpConfig.endpoint}</code>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Protocol</span>
              </div>
              <p className="text-xs text-slate-700">{mcpConfig.protocol}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Available Tools</span>
              </div>
              <p className="text-xs text-slate-700">{mcpConfig.toolsCount} tools across 4 categories</p>
            </div>
          </div>
        </div>

        {/* MCP Tools by Category */}
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Available Tools</h2>
        <div className="space-y-6 mb-12">
          {mcpTools.map((category) => (
            <div key={category.category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">{category.category}</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {category.tools.map((tool) => (
                    <div key={tool.name} className="border-b border-slate-100 pb-4 last:pb-0 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <code className="text-sm font-mono text-blue-700">{tool.name}</code>
                          <p className="text-sm text-slate-600 mt-1">{tool.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Parameters:</span>
                        <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{tool.parameters}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Token Types */}
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">MCP Token Types</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {tokenTypes.map((token) => (
            <div key={token.type} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className={`p-4 border-b border-slate-200 ${
                token.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
                token.color === 'amber' ? 'bg-amber-50 border-amber-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{token.name}</h3>
                    <code className="text-xs bg-white px-2 py-0.5 rounded font-mono mt-1">{token.type}</code>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-600 mb-4">{token.description}</p>
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-slate-700 mb-2">Scopes:</h4>
                  <div className="flex flex-wrap gap-1">
                    {token.scopes.map((scope) => (
                      <span key={scope} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Setup Instructions */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Setup Instructions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">1. Create MCP Token</h3>
              <p className="text-sm text-slate-600 mb-4">
                Go to the <Link href="/" className="text-emerald-700 hover:text-emerald-800">dashboard</Link> and create an MCP token
                with the appropriate access level.
              </p>
              <CodeBlockWithCopy>{`// Example: Create read-only MCP token
Token name: "Claude Code Assistant"
Token type: mcp_ro_
Description: "For AI-assisted development"
`}</CodeBlockWithCopy>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">2. Configure Claude Code</h3>
              <p className="text-sm text-slate-600 mb-4">Add the MCP server to your Claude Code config file:</p>
              <CodeBlockWithCopy>{`// ~/.claude/mcp.json
{
  "mcpServers": {
    "nextmavens": {
      "command": "npx",
      "args": ["-y", "@nextmavens/mcp-server"],
      "env": {
        "NEXTMAVENS_API_KEY": "your_mcp_ro_token_here",
        "NEXTMAVENS_API_URL": "https://api.nextmavens.cloud"
      }
    }
  }
}`}</CodeBlockWithCopy>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">3. Use in AI Tools</h3>
              <p className="text-sm text-slate-600 mb-4">Once configured, you can ask Claude Code to:</p>
              <CodeBlockWithCopy>{`// Example queries you can make:
"Query all users from the database"
"Insert a new user record"
"Get the database schema"
"List all files in storage"
"Execute a GraphQL query to get tenant information"`}</CodeBlockWithCopy>
            </div>
          </div>
        </div>

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
        "text": "{\\"rows\\":[...],\\"rowCount\\":1}"
      }
    ]
  }
}`}</CodeBlockWithCopy>
          </div>
        </div>

        {/* AI Tool Compatibility */}
        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Compatible AI Tools</h2>
          <p className="text-sm text-slate-600 mb-6">
            NextMavens MCP works with any AI tool that supports the Model Context Protocol:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Claude Code</h3>
              <p className="text-xs text-slate-600 mb-2">Anthropic's AI IDE assistant</p>
              <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Recommended: mcp_ro_</span>
            </div>
            <div className="g-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Cursor</h3>
              <p className="text-xs text-slate-600 mb-2">AI-powered code editor</p>
              <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Recommended: mcp_ro_</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">GitHub Copilot</h3>
              <p className="text-xs textslate-600 mb-2">GitHub's AI pair programmer</p>
              <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Recommended: mcp_ro_</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">ChatGPT</h3>
              <p className="text-xs text-slate-600 mb-2">OpenAI's AI assistant</p>
              <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Recommended: mcp_ro_</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-amber-50 rounded-xl p-8 border border-amber-200 mb-12">
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
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Scope Reference</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Scope</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Description</th>
                  <th className="text-center py-3 px-4 font-semibold text-emerald-700">Read-Only</th>
                  <th className="text-center py-3 px-4 font-semibold text-amber-700">Read-Write</th>
                  <th className="text-center py-3 px-4 font-semibold text-red-700">Admin</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4"><code className="bg-slate-100 px-2 py-1 rounded">db:select</code></td>
                  <td className="py-3 px-4 text-slate-600">Query database tables</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">✓</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4"><code className="bg-slate-100 px-2 py-1 rounded">db:insert</code></td>
                  <td className="py-3 px-4 text-slate-600">Insert new records</td>
                  <td className="py-3 px-4 text-center">—</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">✓</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4"><code className="bg-slate-100 px-2 py-1 rounded">db:update</code></td>
                  <td className="py-3 px-4 text-slate-600">Update existing records</td>
                  <td className="py-3 px-4 text-center">—</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">✓</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4"><code className="bg-slate-100 px-2 py-1 rounded">db:delete</code></td>
                  <td className="py-3 px-4 text-slate-600">Delete records</td>
                  <td className="py-3 px-4 text-center">—</td>
                  <td className="py-3 px-4 text-center">—</td>
                  <td className="py-3 px-4 text-center">✓</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4"><code className="bg-slate-100 px-2 py-1 rounded">storage:read</code></td>
                  <td className="py-3 px-4 text-slate-600">Read files from storage</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">✓</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4"><code className="bg-slate-100 px-2 py-1 rounded">storage:write</code></td>
                  <td className="py-3 px-4 text-slate-600">Upload/modify files</td>
                  <td className="py-3 px-4 text-center">—</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4"><code className="bg-slate-100 px-2 py-1 rounded">graphql:execute</code></td>
                  <td className="py-3 px-4 text-slate-600">Execute GraphQL queries</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">✓</td>
                  <td className="py-3 px-4 text-center">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

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
