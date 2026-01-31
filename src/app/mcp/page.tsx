'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Copy,
  Check,
  Globe,
  Database,
  Shield,
  HardDrive,
  Terminal,
  Code2,
  ChevronRight,
  Loader2,
  Github,
  BookOpen,
  Settings,
  Key,
  AlertTriangle,
  Eye,
  Edit3,
  Lock,
} from 'lucide-react'
import { useState } from 'react'

const SoftButton = ({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
  <button
    className={
      'rounded-full px-5 py-2.5 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
      'bg-emerald-900 text-white hover:bg-emerald-800 focus:ring-emerald-700 ' +
      className
    }
    {...props}
  >
    {children}
  </button>
)

interface CodeBlockProps {
  code: string
  language?: string
}

function CodeBlock({ code, language = 'bash' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
      </button>
      <pre className="bg-slate-900 rounded-xl p-5 overflow-x-auto">
        <code className="text-sm text-slate-100 font-mono">
          {code}
        </code>
      </pre>
    </div>
  )
}

// Navigation items for the sidebar
const navItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Globe,
    section: 'overview'
  },
  {
    id: 'installation',
    label: 'Installation',
    icon: Terminal,
    section: 'installation'
  },
  {
    id: 'token-types',
    label: 'Token Types',
    icon: Key,
    section: 'token-types'
  },
  {
    id: 'database',
    label: 'Database Tools',
    icon: Database,
    section: 'database',
    tools: [
      { name: 'nextmavens_query', desc: 'Query database with filters' },
      { name: 'nextmavens_insert', desc: 'Insert new records' },
      { name: 'nextmavens_update', desc: 'Update existing records' },
      { name: 'nextmavens_delete', desc: 'Delete records' },
    ]
  },
  {
    id: 'auth',
    label: 'Auth Tools',
    icon: Shield,
    section: 'auth',
    tools: [
      { name: 'nextmavens_signin', desc: 'Authenticate users' },
      { name: 'nextmavens_signup', desc: 'Register new users' },
    ]
  },
  {
    id: 'storage',
    label: 'Storage Tools',
    icon: HardDrive,
    section: 'storage',
    tools: [
      { name: 'nextmavens_file_info', desc: 'Get file metadata' },
      { name: 'nextmavens_file_download_url', desc: 'Generate download URLs' },
      { name: 'nextmavens_list_files', desc: 'List and filter files' },
    ]
  },
  {
    id: 'graphql',
    label: 'GraphQL Tools',
    icon: Code2,
    section: 'graphql',
    tools: [
      { name: 'nextmavens_graphql', desc: 'Execute GraphQL queries' },
      { name: 'nextmavens_graphql_introspect', desc: 'Explore database schema' },
    ]
  },
  {
    id: 'examples',
    label: 'Examples',
    icon: BookOpen,
    section: 'examples'
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    icon: Settings,
    section: 'troubleshooting'
  },
]

// Tool descriptions and parameters
const toolDetails: Record<string, { description: string; params: Array<{name: string; type: string; required: boolean; description: string}> }> = {
  nextmavens_query: {
    description: 'Execute a database query on NextMavens. Supports SELECT operations with filters for complex queries.',
    params: [
      { name: 'table', type: 'string', required: true, description: 'Table name to query' },
      { name: 'filters', type: 'array', required: false, description: 'Array of filter objects with column, operator (eq, neq, gt, gte, lt, lte, like, ilike, in), and value' },
      { name: 'limit', type: 'number', required: false, description: 'Maximum number of results' },
      { name: 'offset', type: 'number', required: false, description: 'Number of results to skip' },
      { name: 'orderBy', type: 'object', required: false, description: 'Order by column and direction (ascending: boolean)' },
    ]
  },
  nextmavens_insert: {
    description: 'Insert a new row into a database table with the provided data.',
    params: [
      { name: 'table', type: 'string', required: true, description: 'Table name to insert into' },
      { name: 'data', type: 'object', required: true, description: 'Data to insert as key-value pairs' },
    ]
  },
  nextmavens_update: {
    description: 'Update rows in a database table that match the given filters.',
    params: [
      { name: 'table', type: 'string', required: true, description: 'Table name to update' },
      { name: 'data', type: 'object', required: true, description: 'Data to update as key-value pairs' },
      { name: 'filters', type: 'array', required: true, description: 'Filters to identify rows to update' },
    ]
  },
  nextmavens_delete: {
    description: 'Delete rows from a database table that match the given filters.',
    params: [
      { name: 'table', type: 'string', required: true, description: 'Table name to delete from' },
      { name: 'filters', type: 'array', required: true, description: 'Filters to identify rows to delete' },
    ]
  },
  nextmavens_signin: {
    description: 'Sign in a user with their email and password, returning JWT tokens.',
    params: [
      { name: 'email', type: 'string', required: true, description: 'User email address' },
      { name: 'password', type: 'string', required: true, description: 'User password' },
    ]
  },
  nextmavens_signup: {
    description: 'Register a new user with email, password, and optional metadata.',
    params: [
      { name: 'email', type: 'string', required: true, description: 'User email address' },
      { name: 'password', type: 'string', required: true, description: 'User password (min 8 characters)' },
      { name: 'name', type: 'string', required: false, description: 'User display name' },
      { name: 'tenantId', type: 'string', required: false, description: 'Tenant ID for multi-tenancy support' },
    ]
  },
  nextmavens_file_info: {
    description: 'Get detailed information about a file stored in NextMavens Storage.',
    params: [
      { name: 'fileId', type: 'string', required: true, description: 'File ID from Telegram storage' },
    ]
  },
  nextmavens_file_download_url: {
    description: 'Generate a temporary download URL for a file.',
    params: [
      { name: 'fileId', type: 'string', required: true, description: 'File ID from Telegram storage' },
    ]
  },
  nextmavens_list_files: {
    description: 'List files with optional filtering by tenant, file type, and pagination.',
    params: [
      { name: 'tenantId', type: 'string', required: false, description: 'Filter by tenant ID' },
      { name: 'fileType', type: 'string', required: false, description: 'Filter by file type' },
      { name: 'limit', type: 'number', required: false, description: 'Maximum results to return' },
      { name: 'offset', type: 'number', required: false, description: 'Number of results to skip' },
    ]
  },
  nextmavens_graphql: {
    description: 'Execute a GraphQL query against your NextMavens GraphQL endpoint.',
    params: [
      { name: 'query', type: 'string', required: true, description: 'GraphQL query string' },
      { name: 'variables', type: 'object', required: false, description: 'GraphQL variables object' },
    ]
  },
  nextmavens_graphql_introspect: {
    description: 'Get GraphQL schema introspection data for exploring available types, fields, and operations.',
    params: []
  },
}

const tools = [
  { name: 'nextmavens_query', desc: 'Query database with filters', icon: Database },
  { name: 'nextmavens_insert', desc: 'Insert new records', icon: Database },
  { name: 'nextmavens_update', desc: 'Update existing records', icon: Database },
  { name: 'nextmavens_delete', desc: 'Delete records', icon: Database },
  { name: 'nextmavens_signin', desc: 'Authenticate users', icon: Shield },
  { name: 'nextmavens_signup', desc: 'Register new users', icon: Shield },
  { name: 'nextmavens_file_info', desc: 'Get file metadata', icon: HardDrive },
  { name: 'nextmavens_file_download_url', desc: 'Generate download URLs', icon: HardDrive },
  { name: 'nextmavens_list_files', desc: 'List and filter files', icon: HardDrive },
  { name: 'nextmavens_graphql', desc: 'Execute GraphQL queries', icon: Code2 },
  { name: 'nextmavens_graphql_introspect', desc: 'Explore database schema', icon: Code2 },
]

export default function MCPPage() {
  const [activeSection, setActiveSection] = useState<string>('overview')

  return (
    <div className="min-h-screen w-full bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-lg font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="/#solutions" className="text-sm text-slate-600 hover:text-slate-900">Solutions</a>
            <a href="/#product" className="text-sm text-slate-600 hover:text-slate-900">Product</a>
            <a href="/docs" className="text-sm text-slate-600 hover:text-slate-900">Docs</a>
            <a href="/mcp" className="text-sm text-emerald-700 font-medium">MCP</a>
          </div>

          <div className="hidden gap-2 md:flex">
            <a href="/login" className="rounded-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Login
            </a>
            <SoftButton>
              <a href="/register" className="text-white hover:text-white">
                Sign Up
              </a>
            </SoftButton>
          </div>
        </div>
      </nav>

      <main className="flex">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block w-64 bg-white border-r border-slate-200 h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto sidebar-scroll">
          <div className="p-4">
            <div className="mb-6">
              <Link href="/mcp" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to MCP
              </Link>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                    {item.tools && (
                      <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {item.tools.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <a
                href="https://github.com/Mkid095/nextmavens-mcp-server"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <Github className="w-4 h-4" />
                GitHub Repo
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="p-8 max-w-4xl">
            <AnimatePresence mode="wait">
              {/* Overview Section */}
              {activeSection === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                      <Globe className="w-4 h-4" />
                      Model Context Protocol
                    </div>
                    <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-4">
                      Connect AI to your <span className="text-emerald-700">backend instantly</span>
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Integrate NextMavens services with Claude Code, Cursor, and other AI tools using MCP.
                      Access 11 powerful tools for database, auth, storage, and GraphQL operations.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white mb-8">
                    <h2 className="text-2xl font-bold mb-4">What is MCP?</h2>
                    <p className="text-slate-300 leading-relaxed mb-6">
                      The Model Context Protocol (MCP) is an open standard that allows AI assistants to
                      seamlessly connect to external tools and data sources. Think of it as a universal
                      plug-in system for AI applications.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Why Use NextMavens MCP?</h3>
                        <ul className="space-y-2 text-sm">
                          {[
                            'Query databases with natural language',
                            'Create and manage users through chat',
                            'Upload and manage files via AI',
                            'Inspect schema and get context',
                            'Full database, auth, and storage tools',
                          ].map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-slate-300">
                              <span className="text-emerald-400">→</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Quick Start</h3>
                        <div className="bg-black/30 rounded-xl p-4 mb-4">
                          <code className="text-sm text-emerald-300 font-mono">
                            git clone https://github.com/Mkid095/nextmavens-mcp-server.git
                          </code>
                        </div>
                        <p className="text-sm text-slate-300">
                          Get your API key from the{' '}
                          <a href="/dashboard" className="text-emerald-400 hover:text-emerald-300 underline">
                            dashboard
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Available Tools</h2>
                    <p className="text-slate-600 mb-6">11 MCP tools organized by service category</p>

                    <div className="space-y-4">
                      {navItems.filter(item => item.tools).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5 text-emerald-700" />
                            <div>
                              <h3 className="font-medium text-slate-900">{item.label}</h3>
                              <p className="text-sm text-slate-600">{item.tools?.length} tools available</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveSection(item.id)}
                            className="text-sm text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
                          >
                            View tools <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Installation Section */}
              {activeSection === 'installation' && (
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
              )}

              {/* Token Types Section */}
              {activeSection === 'token-types' && (
                <motion.div
                  key="token-types"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-indigo-100 rounded-xl">
                        <Key className="w-6 h-6 text-indigo-700" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-semibold text-slate-900">MCP Token Types</h1>
                        <p className="text-slate-600">Understanding the three levels of MCP access</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Read-Only Token */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-blue-100 rounded-xl">
                            <Eye className="w-8 h-8 text-blue-700" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h2 className="text-2xl font-semibold text-slate-900">Read-Only Token</h2>
                              <code className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-mono">mcp_ro_</code>
                            </div>
                            <p className="text-slate-600">Safest option for AI assistants that only need to read data</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          Default
                        </span>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Scopes</h3>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { scope: 'db:select', desc: 'Query database' },
                            { scope: 'storage:read', desc: 'Read files' },
                            { scope: 'realtime:subscribe', desc: 'Subscribe to events' },
                          ].map((s) => (
                            <div key={s.scope} className="px-4 py-2 bg-slate-100 rounded-lg">
                              <code className="text-sm font-mono text-slate-900">{s.scope}</code>
                              <p className="text-xs text-slate-600 mt-1">{s.desc}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[
                            { scope: 'auth:signin', desc: 'Sign in users', disabled: true },
                            { scope: 'graphql:execute', desc: 'GraphQL queries', disabled: true },
                          ].map((s) => (
                            <div key={s.scope} className="px-4 py-2 bg-slate-50 rounded-lg opacity-60">
                              <code className="text-sm font-mono text-slate-500">{s.scope}</code>
                              <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Use Cases</h3>
                        <ul className="space-y-2">
                          {[
                            'AI assistants that analyze data but never modify it',
                            'Code generation tools that need schema context',
                            'Chatbots that answer questions about your data',
                            'Documentation assistants that explain your database structure',
                          ].map((useCase, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-700">
                              <span className="text-blue-600 mt-1">✓</span>
                              <span>{useCase}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Safest Option</h4>
                            <p className="text-sm text-blue-700">Read-only tokens cannot modify your data, making them safe to use with untrusted AI tools. Ideal for exploration and analysis.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Read-Write Token */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-amber-100 rounded-xl">
                            <Edit3 className="w-8 h-8 text-amber-700" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h2 className="text-2xl font-semibold text-slate-900">Read-Write Token</h2>
                              <code className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-mono">mcp_rw_</code>
                            </div>
                            <p className="text-slate-600">For trusted AI tools that need to create and modify data</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Requires opt-in
                        </span>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Scopes</h3>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { scope: 'db:select', desc: 'Query database' },
                            { scope: 'db:insert', desc: 'Insert records' },
                            { scope: 'db:update', desc: 'Update records' },
                            { scope: 'storage:read', desc: 'Read files' },
                            { scope: 'storage:write', desc: 'Upload files' },
                            { scope: 'realtime:subscribe', desc: 'Subscribe to events' },
                          ].map((s) => (
                            <div key={s.scope} className="px-4 py-2 bg-slate-100 rounded-lg">
                              <code className="text-sm font-mono text-slate-900">{s.scope}</code>
                              <p className="text-xs text-slate-600 mt-1">{s.desc}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[
                            { scope: 'db:delete', desc: 'Delete records', disabled: true },
                            { scope: 'auth:manage', desc: 'User management', disabled: true },
                            { scope: 'realtime:publish', desc: 'Publish events', disabled: true },
                          ].map((s) => (
                            <div key={s.scope} className="px-4 py-2 bg-slate-50 rounded-lg opacity-60">
                              <code className="text-sm font-mono text-slate-500">{s.scope}</code>
                              <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Use Cases</h3>
                        <ul className="space-y-2">
                          {[
                            'AI coding assistants that create database migrations',
                            'Automation tools that insert or update records',
                            'Data processing pipelines that modify your data',
                            'Trusted AI tools that need full read/write access',
                          ].map((useCase, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-700">
                              <span className="text-amber-600 mt-1">✓</span>
                              <span>{useCase}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-amber-900 mb-1">Write Access Warning</h4>
                            <p className="text-sm text-amber-700 mb-2">This token allows AI assistants to modify your data. Only grant to trusted AI systems that you control.</p>
                            <ul className="text-sm text-amber-700 space-y-1">
                              <li>• Read/write tokens can insert, update, and query data</li>
                              <li>• Cannot delete records or manage users</li>
                              <li>• Requires explicit opt-in confirmation during creation</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Token */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-red-100 rounded-xl">
                            <Lock className="w-8 h-8 text-red-700" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h2 className="text-2xl font-semibold text-slate-900">Admin Token</h2>
                              <code className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-mono">mcp_admin_</code>
                            </div>
                            <p className="text-slate-600">Full access including destructive operations - use with extreme caution</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Extra confirmation
                        </span>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Scopes</h3>
                        <p className="text-sm text-slate-600 mb-4">Full access to all operations:</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { scope: 'db:select', desc: 'Query database' },
                            { scope: 'db:insert', desc: 'Insert records' },
                            { scope: 'db:update', desc: 'Update records' },
                            { scope: 'db:delete', desc: 'Delete records' },
                            { scope: 'storage:read', desc: 'Read files' },
                            { scope: 'storage:write', desc: 'Upload files' },
                            { scope: 'auth:manage', desc: 'User management' },
                            { scope: 'realtime:subscribe', desc: 'Subscribe to events' },
                            { scope: 'realtime:publish', desc: 'Publish events' },
                            { scope: 'graphql:execute', desc: 'GraphQL queries' },
                          ].map((s) => (
                            <div key={s.scope} className="px-4 py-2 bg-slate-100 rounded-lg">
                              <code className="text-sm font-mono text-slate-900">{s.scope}</code>
                              <p className="text-xs text-slate-600 mt-1">{s.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Use Cases</h3>
                        <ul className="space-y-2">
                          {[
                            'AI operations tools that manage your entire stack',
                            'Automation scripts that need full lifecycle management',
                            'Trusted AI DevOps assistants for production systems',
                            'Advanced AI tools that require destructive operations',
                          ].map((useCase, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-700">
                              <span className="text-red-600 mt-1">✓</span>
                              <span>{useCase}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-red-50 rounded-xl p-4 border border-red-200 mb-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-red-900 mb-1">Critical Warning - Full Access</h4>
                            <p className="text-sm text-red-700 mb-2">This token has full administrative access including destructive operations.</p>
                            <ul className="text-sm text-red-700 space-y-1">
                              <li>• Can delete records and drop tables</li>
                              <li>• Can manage users and authentication</li>
                              <li>• Can perform any database operation</li>
                              <li>• Requires TWO confirmation steps during creation</li>
                              <li>• Only grant to AI systems you fully trust and control</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-100 rounded-xl p-4 border border-slate-300">
                        <h4 className="font-semibold text-slate-900 mb-2">Best Practices</h4>
                        <ul className="text-sm text-slate-700 space-y-1">
                          <li>• Start with read-only tokens, upgrade only when needed</li>
                          <li>• Use admin tokens only in controlled environments</li>
                          <li>• Rotate admin tokens regularly</li>
                          <li>• Monitor admin token usage in audit logs</li>
                          <li>• Never share admin tokens in public repositories</li>
                        </ul>
                      </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-8">
                      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Token Comparison</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-3 px-4 font-semibold text-slate-900">Feature</th>
                              <th className="text-center py-3 px-4 font-semibold text-blue-700">Read-Only</th>
                              <th className="text-center py-3 px-4 font-semibold text-amber-700">Read-Write</th>
                              <th className="text-center py-3 px-4 font-semibold text-red-700">Admin</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {[
                              { feature: 'Query database', ro: true, rw: true, admin: true },
                              { feature: 'Insert records', ro: false, rw: true, admin: true },
                              { feature: 'Update records', ro: false, rw: true, admin: true },
                              { feature: 'Delete records', ro: false, rw: false, admin: true },
                              { feature: 'Read files', ro: true, rw: true, admin: true },
                              { feature: 'Upload files', ro: false, rw: true, admin: true },
                              { feature: 'User management', ro: false, rw: false, admin: true },
                              { feature: 'Publish events', ro: false, rw: false, admin: true },
                            ].map((row) => (
                              <tr key={row.feature} className="border-b border-slate-100">
                                <td className="py-3 px-4 text-slate-700">{row.feature}</td>
                                <td className="py-3 px-4 text-center">
                                  {row.ro ? <span className="text-blue-600">✓</span> : <span className="text-slate-300">—</span>}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {row.rw ? <span className="text-amber-600">✓</span> : <span className="text-slate-300">—</span>}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {row.admin ? <span className="text-red-600">✓</span> : <span className="text-slate-300">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* When to use each type */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
                      <h2 className="text-2xl font-bold mb-6">Which token type should I use?</h2>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white/10 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-semibold">Start Here</h3>
                          </div>
                          <p className="text-slate-300 text-sm mb-3">
                            Use <code className="bg-white/20 px-2 py-0.5 rounded text-blue-300">mcp_ro_</code> for:
                          </p>
                          <ul className="text-sm text-slate-300 space-y-1">
                            <li>• Exploring your data</li>
                            <li>• Generating reports</li>
                            <li>• Code review and analysis</li>
                            <li>• Documentation assistance</li>
                          </ul>
                        </div>

                        <div className="bg-white/10 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500 rounded-lg">
                              <Edit3 className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-semibold">Need to Modify?</h3>
                          </div>
                          <p className="text-slate-300 text-sm mb-3">
                            Use <code className="bg-white/20 px-2 py-0.5 rounded text-amber-300">mcp_rw_</code> for:
                          </p>
                          <ul className="text-sm text-slate-300 space-y-1">
                            <li>• Creating migrations</li>
                            <li>• Data processing tasks</li>
                            <li>• Trusted AI coding tools</li>
                            <li>• Automation scripts</li>
                          </ul>
                        </div>

                        <div className="bg-white/10 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500 rounded-lg">
                              <Lock className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-semibold">Full Control</h3>
                          </div>
                          <p className="text-slate-300 text-sm mb-3">
                            Use <code className="bg-white/20 px-2 py-0.5 rounded text-red-300">mcp_admin_</code> for:
                          </p>
                          <ul className="text-sm text-slate-300 space-y-1">
                            <li>• AI DevOps operations</li>
                            <li>• Production automation</li>
                            <li>• Full lifecycle management</li>
                            <li>• Destructive operations needed</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tool Sections (Database, Auth, Storage, GraphQL) */}
              {['database', 'auth', 'storage', 'graphql'].includes(activeSection) && (() => {
                const item = navItems.find(i => i.id === activeSection)!
                const Icon = item.icon
                return (
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 rounded-xl ${
                        activeSection === 'database' ? 'bg-blue-100 text-blue-700' :
                        activeSection === 'auth' ? 'bg-purple-100 text-purple-700' :
                        activeSection === 'storage' ? 'bg-orange-100 text-orange-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-semibold text-slate-900">{item.label}</h1>
                        <p className="text-slate-600">{item.tools?.length} tools available</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {item.tools?.map((tool) => {
                        const details = toolDetails[tool.name]
                        return (
                          <div key={tool.name} className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                  <code className="bg-slate-100 px-2 py-1 rounded text-sm">{tool.name}</code>
                                </h3>
                                <p className="text-slate-600">{details?.description || tool.desc}</p>
                              </div>
                              <Icon className="w-5 h-5 text-slate-400" />
                            </div>

                            {details?.params && details.params.length > 0 && (
                              <div className="border-t border-slate-200 pt-4">
                                <h4 className="text-sm font-medium text-slate-900 mb-3">Parameters</h4>
                                <div className="space-y-2">
                                  {details.params.map((param) => (
                                    <div key={param.name} className="flex items-start gap-3 text-sm">
                                      <code className={`px-2 py-0.5 rounded text-xs ${
                                        param.required ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        {param.type}
                                      </code>
                                      <div className="flex-1">
                                        <span className={`font-medium ${param.required ? 'text-slate-900' : 'text-slate-600'}`}>
                                          {param.name}
                                        </span>
                                        {!param.required && <span className="text-slate-400 ml-1">(optional)</span>}
                                        <p className="text-slate-500 text-xs mt-0.5">{param.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="border-t border-slate-200 pt-4 mt-4">
                              <h4 className="text-sm font-medium text-slate-900 mb-2">Example Usage</h4>
                              <CodeBlock code={`# Ask Claude Code to:
"Use ${tool.name} to ${tool.desc.toLowerCase()}"`} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )
              })()}

              {/* Examples Section */}
              {activeSection === 'examples' && (
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
                    {[
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
                    ].map((example, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
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
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Troubleshooting Section */}
              {activeSection === 'troubleshooting' && (
                <motion.div
                  key="troubleshooting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-3xl font-semibold text-slate-900 mb-6">Troubleshooting</h1>

                  <div className="space-y-6">
                    {[
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
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                        <p className="text-slate-600 mb-4">{item.solution}</p>
                        {item.code && <CodeBlock code={item.code} />}
                      </div>
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
              )}
            </AnimatePresence>

            {/* CTA at bottom */}
            <div className="mt-12 pt-8 border-t border-slate-200 text-center">
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Ready to integrate?</h2>
              <p className="text-slate-600 mb-6 max-w-xl mx-auto">
                Get your API key and start using NextMavens MCP tools in your AI workflow today.
              </p>
              <div className="flex items-center justify-center gap-4">
                <SoftButton>
                  <a href="/register" className="flex items-center text-white hover:text-white">
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </a>
                </SoftButton>
                <a
                  href="https://github.com/Mkid095/nextmavens-mcp-server"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
                >
                  <Github className="w-4 h-4" />
                  GitHub Repo
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
