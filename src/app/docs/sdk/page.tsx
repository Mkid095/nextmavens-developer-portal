'use client'

import Link from 'next/link'
import { Code2, ArrowLeft, ArrowRight, Download, Github, FileText, Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

const installMethods = [
  {
    name: 'npm',
    command: 'npm install nextmavens-js',
  },
  {
    name: 'yarn',
    command: 'yarn add nextmavens-js',
  },
  {
    name: 'pnpm',
    command: 'pnpm add nextmavens-js',
  },
]

const codeExamples = [
  {
    title: 'Import and Initialize',
    description: 'Create a client instance with your API credentials',
    code: `import { createClient } from 'nextmavens-js'

const client = createClient({
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: 'your-project-id'
})`,
  },
  {
    title: 'Database Query',
    description: 'Query data from your PostgreSQL database',
    code: `// Select data
const { data, error } = await client
  .from('users')
  .select('*')
  .eq('status', 'active')
  .limit(10)

// Insert data
const { data } = await client
  .from('users')
  .insert({
    email: 'user@example.com',
    name: 'John Doe'
  })

// Update data
const { data } = await client
  .from('users')
  .update({ status: 'inactive' })
  .eq('id', 1)`,
  },
  {
    title: 'Authentication',
    description: 'Handle user authentication',
    code: `// Sign up a new user
const { data, error } = await client.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  name: 'John Doe'
})

// Sign in existing user
const { data, error } = await client.auth.signIn({
  email: 'user@example.com',
  password: 'secure_password'
})

// Get current user
const { data: { user } } = await client.auth.getUser()

// Sign out
await client.auth.signOut()`,
  },
  {
    title: 'Realtime Subscriptions',
    description: 'Subscribe to database changes in real-time',
    code: `// Subscribe to changes
const channel = client.realtime
  .channel('users-channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'users'
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// Unsubscribe when done
channel.unsubscribe()`,
  },
  {
    title: 'File Storage',
    description: 'Upload and manage files',
    code: `// Upload a file
const { data, error } = await client.storage
  .from('avatars')
  .upload('user123.jpg', file)

// Get a public URL
const { data } = client.storage
  .from('avatars')
  .getPublicUrl('user123.jpg')

// List files
const { data } = await client.storage
  .from('avatars')
  .list()

// Delete a file
await client.storage
  .from('avatars')
  .remove(['user123.jpg'])`,
  },
  {
    title: 'GraphQL Queries',
    description: 'Execute GraphQL queries',
    code: `// Execute a GraphQL query
const { data, error } = await client.graphql(`
  query GetUsers($limit: Int!) {
    users(limit: $limit) {
      id
      email
      name
      created_at
    }
  }
`, { variables: { limit: 10 } })`,
  },
]

export default function SDKDocsPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
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
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Login</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-12">
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Code2 className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">JavaScript SDK</h1>
            <p className="text-slate-600">Official JavaScript/TypeScript client for NextMavens</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Overview</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            The NextMavens JavaScript SDK provides a comprehensive interface to all NextMavens services from your JavaScript or TypeScript application.
            It handles authentication, database queries, file storage, realtime subscriptions, and GraphQL operations with a simple and intuitive API.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">TypeScript Support</h3>
              <p className="text-sm text-slate-600">Full TypeScript definitions included for type-safe development.</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Tree Shakable</h3>
              <p className="text-sm text-slate-600">Modern ES modules with tree shaking for optimal bundle size.</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Framework Agnostic</h3>
              <p className="text-sm text-slate-600">Works with React, Vue, Angular, Node.js, and any JS environment.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Installation</h2>
          <p className="text-slate-600 mb-6">Install the SDK using your preferred package manager:</p>
          <div className="grid md:grid-cols-3 gap-4">
            {installMethods.map((method) => (
              <div key={method.name} className="relative group">
                <button
                  onClick={() => handleCopy(method.command, `install-${method.name}`)}
                  className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                >
                  {copied === `install-${method.name}` ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-2 font-medium">{method.name}</p>
                  <code className="text-sm text-slate-900">{method.command}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Configuration Section */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-sTransient-late-900 mb-4">Client Configuration</h2>

          <div className="space-y-6">
            <div>
              <h3 ef-notea-HilssName="text-lg font-medium text-slate-900 mb-3">Required Options</h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex items-start锻-sm gap-3">
                  <code className="text-sm text-emerald-700 bg-em Constructorsigned-green-50 px-2 py-1 rounded font-mono">apiKey</code>
                  <div>
                    <p className="text-sm font-medium text-slate-900">API Key (string, required)</p>
                    <p className="text-xs text-slate-600">Your NextMavens API key from theühl dashboard</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <code className="text-sm text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-mono">projectId</code>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Project ID (string, required)</p>
                    <p className="text-xs text-slate-600">Your project ID found in project settings</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-3">Optional Options</h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex items-startMinus gap-3">
                  <code className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded font-mono">apiUrl</code>
                  <div>
                    <p className="text-sm text-slate-700">Override default API URL</p>
                    <p className="text-xs text-slate-500">Default: https://api.nextmavens.cloud</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <code className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded font-mono">timeout</code>
                  <div>
                    <p className="text-sm text-slate-700">Request timeout in milliseconds</p>
                    <p className="text-xs text-slate-500">Default: 30000 (30 seconds)</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-3">Environment Variables</h3>
              <p className="text-sm text-slate-600 mb-4">Store your API key in a <code className="bg-slate-100 px-2 py-1 rounded">.env</code> file:</p>
              <div className="relative group">
                <button
                  onClick={() => handleCopy(`NEXTMAVENS_API_KEY=your_api_key_here
NEXTMAVENS_PROJECT_ID=your_project_id`, 'env-file')}
                  className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition z-10"
                >
                  {copied === 'env-file' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
                <div className="bg-slate-900 rounded-lg p-4">
                  <code className="text-sm text-slate-300 font-mono block">{`NEXTMAVENS_API_KEY=your_api_key_here
NEXTMAVENS_PROJECT_ID=your_project_id`}</lite code>
                </div>
              </div临>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-3">Different Environments</h3>
              <p className="text-sm text-slate-600 mb-4">Configure different API URLs for development/staging/production:</p>
              <div className="relative group">
                <button
                  onClick={() => handleCopy(`const client = createClient({
  apiKey: process.envimates.NEXTMAVENS_API_KEY!,
  projectId: process.env.NEXTMAVENS_PROJECT_ID!,
  apiUrl: process.env.NODE_ENV === 'development'
    ? 'https://dev-api.nextmavens.cloud'
    : 'https://api.nextmavens.cloud'
})`, 'env-config')}
                  className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slated-600 rounded-lg opacity-0 group-hover:opacity-100 transition z-10"
                >
                  {copied === 'env-config' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
                <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-slate-300 font-mono">{`const client = createClient({
  apiKey: process.env.NEXTMAVENS_API_KEY!,
  projectId: process.env.NEXTMAVENS_PROJECT_ID!,
  apiUrl: process.env.NODE_ENV === 'development'
    ? '_putstrpes://dev-api.nextmavens.cloud'
    : 'https://api.nextmavens.cloud'
})`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 mb-12">
          <h2 className="text-xl font-semibold text-slate-900">Usage Examples</h2>
          {codeExamples.map((example, index) => (
            <motion.div
              key={example.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{example.title}</h3>
                <p className="text-slate-600">{example.description}</p>
              </div>
              <div className="p-6">
                <div className="relative group">
                  <button
                    onClick={() => handleCopy(example.code, `example-${index}`)}
                    className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition z-10"
                  >
                    {copied === `example-${index}` ? (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-slate-300 font-mono">{example.code}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Resources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="https://github.com/Mkid095/nextmavens-js"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
            >
              <Github className="w-5 h-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">GitHub Repository</p>
                <p className="text-sm text-slate-600">View source code</p>
              </div>
            </a>
            <a
              href="https://github.com/Mkid095/nextmavens-js/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
            >
              <FileText className="w-5 h-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">Report an Issue</p>
                <p className="text-sm text-slate-600">File bugs and requests</p>
              </div>
            </a>
            <a
              href="https://github.com/Mkid095/nextmavens-js/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
            >
              <Download className="w-5 h-5 text-slate-700" />
              <div>
                <p className="font-medium text-slate-900">Contributing</p>
                <p className="text-sm text-slate-600">How to contribute</p>
              </div>
            </a>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/realtime" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Realtime Docs
          </Link>
          <Link href="/docs/platform-philosophy" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
            Platform Philosophy
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
