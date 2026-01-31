'use client'

import Link from 'next/link'
import { Shield, ArrowLeft, ArrowRight, Server, CheckCircle, Lock, Clock } from 'lucide-react'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

const authConfig = {
  domain: 'https://auth.nextmavens.cloud',
  port: 4000,
  jwtSecret: 'nextmavens-auth-secret-key-2024-production-secure',
  accessTokenExpiry: '1 hour',
  refreshTokenExpiry: '7 days',
}

const endpoints = [
  {
    name: 'Login',
    method: 'POST',
    path: '/api/auth/login',
    gatewayPath: '/api/auth/login',
    description: 'Authenticate user with email and password',
    request: {
      email: 'string',
      password: 'string',
    },
    response: {
      user: 'User object with id, email, name, role, tenant_id',
      accessToken: 'JWT token (expires in 1 hour)',
      refreshToken: 'JWT token (expires in 7 days)',
    },
  },
  {
    name: 'Signup',
    method: 'POST',
    path: '/api/auth/signup',
    gatewayPath: '/api/auth/signup',
    description: 'Register a new user account',
    request: {
      email: 'string',
      password: 'string (min 8 characters)',
      name: 'string',
    },
    response: {
      user: 'Created user object',
      accessToken: 'JWT token',
      refreshToken: 'JWT token',
    },
  },
  {
    name: 'Refresh Token',
    method: 'POST',
    path: '/api/auth/refresh',
    gatewayPath: '/api/auth/refresh',
    description: 'Get a new access token using refresh token',
    request: {
      refreshToken: 'string',
    },
    response: {
      accessToken: 'New JWT token',
    },
  },
  {
    name: 'Logout',
    method: 'POST',
    path: '/api/auth/logout',
    gatewayPath: '/api/auth/logout',
    description: 'Invalidate current session',
    request: {
      refreshToken: 'string',
    },
    response: {
      success: 'boolean',
    },
  },
  {
    name: 'Get Current User',
    method: 'GET',
    path: '/api/auth/me',
    gatewayPath: '/api/auth/me',
    description: 'Get currently authenticated user',
    headers: {
      Authorization: 'Bearer <token>',
    },
    response: {
      user: 'User object',
    },
  },
]

const jwtStructure = {
  header: 'alg: HS256, typ: JWT',
  payload: {
    userId: 'integer',
    email: 'string',
    tenantId: 'uuid (optional)',
    role: 'string (user|owner|admin)',
    iat: 'issued at timestamp',
    exp: 'expiration timestamp',
  },
}

export default function AuthDocsPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
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
          <div className="p-3 bg-purple-100 rounded-xl">
            <Shield className="w-6 h-6 text-purple-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Authentication Service</h1>
            <p className="text-slate-600">Secure user authentication with JWT tokens</p>
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-12">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Service Information</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Domain</span>
              </div>
              <code className="text-xs text-blue-700 break-all">{authConfig.domain}</code>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Port</span>
              </div>
              <code className="text-xs text-slate-700">{authConfig.port}</code>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Access Token</span>
              </div>
              <p className="text-xs text-slate-600">{authConfig.accessTokenExpiry}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Refresh Token</span>
              </div>
              <p className="text-xs text-slate-600">{authConfig.refreshTokenExpiry}</p>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">API Endpoints</h2>
        <div className="space-y-6 mb-12">
          {endpoints.map((endpoint, index) => (
            <div key={endpoint.name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">{endpoint.name}</h3>
                    <p className="text-slate-600">{endpoint.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                    {endpoint.method}
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Direct:</span>
                    <code className="ml-1 bg-slate-100 px-2 py-0.5 rounded">{authConfig.domain}{endpoint.path}</code>
                  </div>
                  <div>
                    <span className="text-slate-500">Via Gateway:</span>
                    <code className="ml-1 bg-slate-100 px-2 py-0.5 rounded">https://api.nextmavens.cloud{endpoint.gatewayPath}</code>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="font-semibold text-slate-900 mb-3">Request</h4>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {endpoint.request && (
                    <div>
                      <h5 className="text-xs font-medium text-slate-700 mb-2">Body Parameters</h5>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <CodeBlockWithCopy>{JSON.stringify(endpoint.request, null, 2)}</CodeBlockWithCopy>
                      </div>
                    </div>
                  )}
                  {endpoint.headers && (
                    <div>
                      <h5 className="text-xs font-medium text-slate-700 mb-2">Headers</h5>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <CodeBlockWithCopy>{JSON.stringify(endpoint.headers, null, 2)}</CodeBlockWithCopy>
                      </div>
                    </div>
                  )}
                </div>

                <h4 className="font-semibold text-slate-900 mb-3">Response</h4>
                <div className="bg-slate-50 rounded-lg p-3">
                  <CodeBlockWithCopy>{JSON.stringify({ success: true, data: endpoint.response }, null, 2)}</CodeBlockWithCopy>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* JWT Structure */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">JWT Token Structure</h2>
          <p className="text-slate-600 mb-6">
            Access tokens are JWTs signed with HMAC-SHA256. Include them in the Authorization header.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Header</h3>
              <div className="bg-slate-900 rounded-lg p-4">
                <code className="text-xs text-emerald-400 block">
                  {JSON.stringify(jwtStructure.header, null, 2)}
                </code>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Payload</h3>
              <div className="bg-slate-900 rounded-lg p-4">
                <code className="text-xs text-emerald-400 block">
                  {JSON.stringify(jwtStructure.payload, null, 2)}
                </code>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-slate-900 mb-3">Usage Example</h3>
            <CodeBlockWithCopy>{`// Make authenticated request
const response = await fetch('https://api.nextmavens.cloud/users', {
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json',
  },
})`}</CodeBlockWithCopy>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Security Best Practices</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Store Tokens Securely</h3>
                <p className="text-sm text-slate-600">Never store tokens in localStorage. Use httpOnly cookies or secure storage.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Handle Token Expiry</h3>
                <p className="text-sm text-slate-600">Refresh tokens before expiry. Implement automatic token refresh.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Use HTTPS Only</h3>
                <p className="text-sm text-slate-600">Never send tokens over unencrypted connections.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Validate Tokens</h3>
                <p className="text-sm text-slate-600">Always validate token signature and expiration on the server.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/api-keys" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            API Keys
          </Link>
          <Link href="/docs/database" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
            Database Docs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
