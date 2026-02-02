/**
 * Errors Documentation - Error Response Format Component
 */

export function ErrorResponseFormat() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Error Response Format</h2>
      <p className="text-slate-600 mb-4">All errors follow a standard format:</p>
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
  )
}
