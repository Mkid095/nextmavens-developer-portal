'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
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
  return (
    <div className="min-h-screen w-full bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-4 py-6 md:px-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
            </svg>
          </div>
          <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">nextmavens</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="/#solutions" className="text-sm text-slate-600 hover:text-slate-900">Solutions</a>
          <a href="/#product" className="text-sm text-slate-600 hover:text-slate-900">Product</a>
          <a href="/docs" className="text-sm text-slate-600 hover:text-slate-900">Docs</a>
          <a href="/mcp" className="text-sm text-slate-900 font-medium">MCP</a>
        </div>

        <div className="hidden gap-2 md:flex">
          <a href="/login" className="rounded-full px-4 py-2 text-sm text-slate-700 hover:bg-white">
            Login
          </a>
          <SoftButton>
            <a href="/register" className="text-white hover:text-white">
              Sign Up
            </a>
          </SoftButton>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 pb-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-[120px] pb-16"
        >
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              Model Context Protocol
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight text-slate-900 mb-6">
              Connect AI to your<br/>
              <span className="text-emerald-700">backend instantly.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-[600px] leading-relaxed">
              Integrate NextMavens services with Claude Code, Cursor, Continue.dev and other AI tools using MCP. 11 powerful tools for database, auth, storage, and GraphQL.
            </p>
          </div>
        </motion.div>

        {/* GitHub Installation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 p-8 mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-900 rounded-xl">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">GitHub Installation</h2>
              <p className="text-slate-600">Clone and run the MCP server locally</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                1. Clone the repository
              </label>
              <CodeBlock code="git clone https://github.com/Mkid095/nextmavens-mcp-server.git" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                2. Navigate and install dependencies
              </label>
              <CodeBlock code={`cd nextmavens-mcp-server
npm install`} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
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
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Add via CLI
                </label>
                <CodeBlock code={`claude mcp add --transport http nextmavens \\
  --url http://localhost:3000/mcp \\
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
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Cursor</h3>
                <p className="text-sm text-slate-600">IDE Configuration</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Add to settings.json
                </label>
                <CodeBlock code={`{
  "mcpServers": {
    "nextmavens": {
      "transport": {
        "type": "http",
        "url": "http://localhost:3000/mcp",
        "headers": {
          "Authorization": "Bearer \${env:NEXTMAVENS_API_KEY}"
        }
      }
    }
  }
}`} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Available Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 p-8 mb-12"
        >
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Available Tools</h2>
          <p className="text-slate-600 mb-8">11 MCP tools organized by service</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <tool.icon className="w-4 h-4 text-emerald-700" />
                  <code className="text-sm font-medium text-slate-900">{tool.name}</code>
                </div>
                <p className="text-sm text-slate-600">{tool.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Example Conversations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-200 p-8 mb-12"
        >
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Example Conversations</h2>
          <p className="text-slate-600 mb-8">See how AI assistants can use NextMavens tools</p>

          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">Y</span>
                </div>
                <div className="flex-1">
                  <p className="text-slate-900">Show me all users created in the last 7 days</p>
                </div>
              </div>
              <div className="flex items-start gap-4 mt-4">
                <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    <span className="font-mono text-emerald-700">nextmavens_query</span> called with filters for created_at &gt; 7 days ago...
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">Y</span>
                </div>
                <div className="flex-1">
                  <p className="text-slate-900">Create a new user with email john@example.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4 mt-4">
                <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    <span className="font-mono text-emerald-700">nextmavens_signup</span> called with email, generating secure password...
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">Y</span>
                </div>
                <div className="flex-1">
                  <p className="text-slate-900">What tables exist in my database?</p>
                </div>
              </div>
              <div className="flex items-start gap-4 mt-4">
                <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    <span className="font-mono text-emerald-700">nextmavens_graphql_introspect</span> called to retrieve schema information...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-semibold text-slate-900 mb-4">Ready to integrate?</h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
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
              <Terminal className="w-4 h-4" />
              GitHub Repo
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
