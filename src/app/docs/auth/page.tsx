'use client'

import Link from 'next/link'
import { Shield, ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const tools = [
  {
    name: 'nextmavens_signin',
    description: 'Authenticate a user with email and password',
    method: 'POST',
    endpoint: '/auth/signin',
    params: [
      { name: 'email', type: 'string', required: true, description: 'User email address' },
      { name: 'password', type: 'string', required: true, description: 'User password' },
    ],
    response: {
      user: 'User object (id, email, name)',
      accessToken: 'JWT access token (1 hour expiry)',
      refreshToken: 'JWT refresh token (7 day expiry)',
    },
    example: {
      email: 'user@example.com',
      password: 'securepassword123',
    },
  },
  {
    name: 'nextmavens_signup',
    description: 'Register a new user account',
    method: 'POST',
    endpoint: '/auth/signup',
    params: [
      { name: 'email', type: 'string', required: true, description: 'User email address' },
      { name: 'password', type: 'string', required: true, description: 'User password (min 8 characters)' },
      { name: 'name', type: 'string', required: true, description: 'User display name' },
      { name: 'metadata', type: 'object', required: false, description: 'Additional user metadata' },
    ],
    response: {
      user: 'Created user object',
      accessToken: 'JWT access token',
      refreshToken: 'JWT refresh token',
    },
    example: {
      email: 'newuser@example.com',
      password: 'securepassword123',
      name: 'John Doe',
      metadata: { organization: 'Acme Inc' },
    },
  },
]

export default function AuthDocsPage() {
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
          <div className="p-3 bg-purple-100 rounded-xl">
            <Shield className="w-6 h-6 text-purple-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Authentication Service</h1>
            <p className="text-slate-600">Secure user authentication with JWT tokens</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Overview</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            The Authentication service provides secure user registration and login with JWT-based tokens.
            Passwords are hashed using bcrypt and never stored in plain text.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Access Token</h3>
              <p className="text-sm text-slate-600">Valid for 1 hour. Include in Authorization header.</p>
              <code className="text-xs text-slate-700 mt-2 block">Authorization: Bearer &lt;token&gt;</code>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Refresh Token</h3>
              <p className="text-sm text-slate-600">Valid for 7 days. Use to get new access tokens.</p>
              <code className="text-xs text-slate-700 mt-2 block">POST /auth/refresh</code>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">{tool.name}</h3>
                    <p className="text-slate-600">{tool.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                    {tool.method}
                  </span>
                </div>
                <code className="text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded block">
                  {tool.endpoint}
                </code>
              </div>

              <div className="p-6">
                <h4 className="font-semibold text-slate-900 mb-4">Parameters</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Required</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tool.params.map((param) => (
                        <tr key={param.name} className="border-b border-slate-100">
                          <td className="py-3 px-4">
                            <code className="text-slate-900">{param.name}</code>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{param.type}</td>
                          <td className="py-3 px-4">
                            {param.required ? (
                              <span className="text-red-600">Required</span>
                            ) : (
                              <span className="text-slate-500">Optional</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 className="font-semibold text-slate-900 mt-6 mb-4">Example Request</h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300">
                    <code>{JSON.stringify(tool.example, null, 2)}</code>
                  </pre>
                </div>

                <h4 className="font-semibold text-slate-900 mt-6 mb-4">Response</h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300">
                    <code>{JSON.stringify({ success: true, data: tool.response }, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/database" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Database Docs
          </Link>
          <Link href="/docs/storage" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
            Storage Docs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
