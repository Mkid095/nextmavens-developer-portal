import Link from 'next/link'
import { ArrowLeft, AlertCircle, RefreshCw, XCircle, Shield, FileQuestion, Ban, Unlock, Lock } from 'lucide-react'

interface ErrorDoc {
  code: string
  title: string
  httpStatus: number
  retryable: boolean
  description: string
  commonCauses: string[]
  solutions: string[]
  icon: any
  color: string
}

const errorDocs: ErrorDoc[] = [
  {
    code: 'PROJECT_SUSPENDED',
    title: 'Project Suspended',
    httpStatus: 403,
    retryable: false,
    description: 'The project has been suspended due to abuse detection, hard cap violations, or administrative action.',
    commonCauses: [
      'Exceeded daily hard caps (DB queries, storage uploads, function invocations)',
      'Abuse patterns detected (SQL injection attempts, auth brute force)',
      'Administrative suspension',
    ],
    solutions: [
      'Review the suspension notification email for details',
      'Contact support to resolve the issue',
      'Reduce usage to stay within quotas after reinstatement',
    ],
    icon: Ban,
    color: 'red',
  },
  {
    code: 'PROJECT_ARCHIVED',
    title: 'Project Archived',
    httpStatus: 403,
    retryable: false,
    description: 'The project has been archived and is no longer accessible.',
    commonCauses: [
      'Project was manually archived',
      'Account was closed',
    ],
    solutions: [
      'Restore the project from the dashboard if within retention period',
      'Contact support for assistance',
    ],
    icon: FileQuestion,
    color: 'gray',
  },
  {
    code: 'PROJECT_DELETED',
    title: 'Project Deleted',
    httpStatus: 404,
    retryable: false,
    description: 'The project has been permanently deleted.',
    commonCauses: [
      'Project was manually deleted',
      'Account was terminated',
    ],
    solutions: [
      'Create a new project',
      'Contact support if deletion was accidental',
    ],
    icon: XCircle,
    color: 'gray',
  },
  {
    code: 'RATE_LIMITED',
    title: 'Rate Limited',
    httpStatus: 429,
    retryable: true,
    description: 'Too many requests were made within a short time period.',
    commonCauses: [
      'Exceeded rate limit per minute/hour/day',
      'Burst traffic patterns',
      'Improper error handling causing retry loops',
    ],
    solutions: [
      'Implement exponential backoff for retries',
      'Check the Retry-After header in the response',
      'Reduce request frequency',
      'Use batching for bulk operations',
    ],
    icon: RefreshCw,
    color: 'orange',
  },
  {
    code: 'QUOTA_EXCEEDED',
    title: 'Quota Exceeded',
    httpStatus: 429,
    retryable: false,
    description: 'Monthly quota limits have been reached.',
    commonCauses: [
      'Exceeded monthly DB query quota',
      'Exceeded monthly storage quota',
      'Exceeded monthly function invocation quota',
    ],
    solutions: [
      'Wait for quota reset at the beginning of next month',
      'Upgrade to a higher tier plan',
      'Optimize queries to reduce usage',
    ],
    icon: AlertCircle,
    color: 'orange',
  },
  {
    code: 'KEY_INVALID',
    title: 'Invalid API Key',
    httpStatus: 401,
    retryable: false,
    description: 'The API key provided is invalid, expired, or revoked.',
    commonCauses: [
      'API key was revoked or rotated',
      'API key expired',
      'Incorrect API key in request headers',
    ],
    solutions: [
      'Verify the API key in your dashboard',
      'Generate a new API key if needed',
      'Check that the key is correctly set in Authorization header',
    ],
    icon: Lock,
    color: 'red',
  },
  {
    code: 'SERVICE_DISABLED',
    title: 'Service Disabled',
    httpStatus: 403,
    retryable: false,
    description: 'A specific service (Database, Storage, Realtime, etc.) is not enabled for this project.',
    commonCauses: [
      'Service not enabled in project settings',
      'Service was disabled after trial period',
    ],
    solutions: [
      'Enable the service from the project dashboard',
      'Check service availability for your plan',
    ],
    icon: Ban,
    color: 'purple',
  },
  {
    code: 'PERMISSION_DENIED',
    title: 'Permission Denied',
    httpStatus: 403,
    retryable: false,
    description: 'Insufficient permissions to perform the requested action.',
    commonCauses: [
      'Attempting to access another project\'s resources',
      'User role does not have required permissions',
      'Attempting to access admin-only endpoints',
    ],
    solutions: [
      'Verify you have the correct project selected',
      'Check your user role and permissions',
      'Contact project owner for access',
    ],
    icon: Shield,
    color: 'red',
  },
  {
    code: 'AUTHENTICATION_ERROR',
    title: 'Authentication Error',
    httpStatus: 401,
    retryable: false,
    description: 'Authentication is required or the provided credentials are invalid.',
    commonCauses: [
      'Missing or invalid JWT token',
      'Token expired',
      'Invalid email/password combination',
    ],
    solutions: [
      'Sign in again to get a fresh token',
      'Verify your credentials',
      'Check that Authorization header is set correctly',
    ],
    icon: Lock,
    color: 'red',
  },
  {
    code: 'VALIDATION_ERROR',
    title: 'Validation Error',
    httpStatus: 400,
    retryable: false,
    description: 'The request contains invalid data or parameters.',
    commonCauses: [
      'Invalid query parameters',
      'Missing required fields',
      'Invalid data format',
      'Schema validation failed',
    ],
    solutions: [
      'Check the error details for specific validation issues',
      'Review API documentation for correct request format',
      'Ensure all required fields are included',
    ],
    icon: AlertCircle,
    color: 'yellow',
  },
  {
    code: 'NOT_FOUND',
    title: 'Not Found',
    httpStatus: 404,
    retryable: false,
    description: 'The requested resource does not exist.',
    commonCauses: [
      'Resource was deleted',
      'Incorrect resource ID',
      'Invalid endpoint path',
    ],
    solutions: [
      'Verify the resource ID is correct',
      'Check that the resource still exists',
      'Review the API documentation for correct endpoints',
    ],
    icon: FileQuestion,
    color: 'gray',
  },
  {
    code: 'CONFLICT',
    title: 'Conflict',
    httpStatus: 409,
    retryable: false,
    description: 'The request conflicts with existing data or state.',
    commonCauses: [
      'Resource already exists',
      'Duplicate unique field value',
      'Concurrent modification conflict',
    ],
    solutions: [
      'Check if resource already exists before creating',
      'Use unique identifiers for resources',
      'Implement optimistic locking for concurrent updates',
    ],
    icon: AlertCircle,
    color: 'yellow',
  },
  {
    code: 'INTERNAL_ERROR',
    title: 'Internal Server Error',
    httpStatus: 500,
    retryable: true,
    description: 'An unexpected error occurred on the server.',
    commonCauses: [
      'Temporary server issue',
      'Database connection problem',
      'Service temporarily unavailable',
    ],
    solutions: [
      'Retry the request with exponential backoff',
      'Check status page for service availability',
      'Contact support if issue persists',
    ],
    icon: AlertCircle,
    color: 'red',
  },
]

export default function ErrorsPage() {
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
            <Link href="/docs" className="text-sm text-slate-600 hover:text-slate-900">Docs</Link>
            <Link href="/docs/errors" className="text-sm text-slate-900 font-medium">Errors</Link>
            <Link href="/mcp" className="text-sm text-slate-600 hover:text-slate-900">MCP</Link>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Login</Link>
            <Link href="/register" className="text-sm bg-emerald-900 text-white px-4 py-2 rounded-full hover:bg-emerald-800">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-16">
        <div className="mb-8">
          <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Documentation
          </Link>
        </div>

        <div className="max-w-4xl mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-700" />
            </div>
            <h1 className="text-4xl font-semibold text-slate-900">Error Codes Reference</h1>
          </div>
          <p className="text-xl text-slate-600">
            Complete reference for all error codes returned by the NextMavens API.
            Each error includes the code, HTTP status, retryability, common causes, and solutions.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Error Response Format</h2>
          <p className="text-slate-600 mb-4">
            All errors follow a standard format:
          </p>
          <pre className="bg-slate-100 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{`{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "docs": "/docs/errors#RATE_LIMITED",
    "retryable": true,
    "project_id": "uuid",
    "details": {
      "retry_after": 60
    },
    "timestamp": "2024-01-30T00:00:00.000Z"
  }
}`}</code>
          </pre>
        </div>

        <div className="space-y-6">
          {errorDocs.map((error) => {
            const Icon = error.icon
            const colorClasses = {
              red: 'bg-red-100 text-red-700 border-red-200',
              orange: 'bg-orange-100 text-orange-700 border-orange-200',
              yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
              gray: 'bg-gray-100 text-gray-700 border-gray-200',
              purple: 'bg-purple-100 text-purple-700 border-purple-200',
            }[error.color]

            return (
              <div
                key={error.code}
                id={error.code}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${colorClasses}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-semibold text-slate-900">{error.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            error.retryable
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {error.retryable ? 'Retryable' : 'Not Retryable'}
                          </span>
                        </div>
                        <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                          {error.code}
                        </code>
                        <span className="text-sm text-slate-500 ml-3">HTTP {error.httpStatus}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600 mt-4">{error.description}</p>
                </div>

                <div className="p-6 bg-slate-50">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Common Causes</h4>
                      <ul className="space-y-2">
                        {error.commonCauses.map((cause, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-slate-400 mt-1">•</span>
                            <span className="text-sm text-slate-600">{cause}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Solutions</h4>
                      <ul className="space-y-2">
                        {error.solutions.map((solution, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-1">✓</span>
                            <span className="text-sm text-slate-600">{solution}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Need More Help?</h3>
          <p className="text-blue-800 mb-4">
            If you're encountering an error that's not covered here, or if the solutions don't resolve your issue,
            please contact our support team.
          </p>
          <Link
            href="/support"
            className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
          >
            Contact Support
          </Link>
        </div>
      </main>
    </div>
  )
}
