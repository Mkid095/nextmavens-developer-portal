export default function Services() {
  return (
    <section id="services" className="py-20">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Services</h2>
          <p className="text-lg text-slate-600 max-w-[600px] mx-auto">
            Comprehensive backend services, all connected through one API key.
          </p>
        </div>

        <div className="space-y-8">
          {/* Database Service */}
          <div className="bg-white border border-slate-200 rounded-2xl p-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 stroke-emerald-700" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <ellipse cx="12" cy="5" rx="3" />
                  <path d="M21 12c0 1.66-1.34 3-3 3s-3-1.34-3-3m0 0c-1.66 0-3 1.34-3 3s1.34 3 3 3m0-6c-1.66 0-3 1.34-3 3s1.34 3 3 3m0 6c-1.66 0-3 1.34-3 3s1.34 3 3 3" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Database Service</h3>
                <p className="text-slate-600">
                  PostgreSQL with auto-generated REST & GraphQL APIs, plus Row-Level Security.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Capabilities</h4>
              <ul className="space-y-2">
                <li className="text-slate-600 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>Auto REST API</strong> - PostgREST generates RESTful endpoints from your schema</span>
                </li>
                <li className="text-slate-600 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>GraphQL API</strong> - Postgraphile provides type-safe GraphQL</span>
                </li>
                <li className="text-slate-600 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>Row-Level Security</strong> - Multi-tenant data isolation at database level</span>
                </li>
                <li className="text-slate-600 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>Real-time Subscriptions</strong> - Listen to database changes via WebSocket</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-4">SDK Installation</h4>
              <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
                <pre className="text-sm text-slate-100 font-mono leading-relaxed">
                  <code className="text-emerald-400">
                    {`# Install from GitHub
pnpm add https://github.com/Mkid095/nextmavens-js.git

# Or add to package.json
{
  "dependencies": {
    "nextmavens-js": "github:Mkid095/nextmavens-js"
  }
}`}
                  </code>
                </pre>
              </div>
            </div>
          </div>

          {/* Auth Service */}
          <div className="bg-white border border-slate-200 rounded-2xl p-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 stroke-emerald-700" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Authentication Service</h3>
                <p className="text-slate-600">
                  Complete authentication system with JWT tokens, user management, and secure password handling.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Endpoints</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Login', value: 'POST https://auth.nextmavens.cloud/api/auth/login' },
                  { label: 'Signup', value: 'POST https://auth.nextmavens.cloud/api/auth/signup' },
                  { label: 'Refresh Token', value: 'POST https://auth.nextmavens.cloud/api/auth/refresh' },
                  { label: 'Get Current User', value: 'GET https://auth.nextmavens.cloud/api/auth/me' },
                ].map((endpoint) => (
                  <div key={endpoint.label} className="bg-slate-50 rounded-xl p-5">
                    <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      {endpoint.label}
                    </div>
                    <div className="font-mono text-sm text-slate-700 break-all">{endpoint.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Realtime Service */}
          <div className="bg-white border border-slate-200 rounded-2xl p-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 stroke-emerald-700" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Realtime Service</h3>
                <p className="text-slate-600">
                  WebSocket-based real-time data sync with automatic reconnection and row-level filtering.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Features</h4>
              <ul className="space-y-2">
                <li className="text-slate-600 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>WebSocket Protocol</strong> - Efficient bidirectional communication</span>
                </li>
                <li className="text-slate-600 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>PostgreSQL LISTEN/NOTIFY</strong> - Database-driven notifications</span>
                </li>
                <li className="text-slate-600 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>Per-table Subscriptions</strong> - Subscribe to specific tables</span>
                </li>
                <li className="text-slate-600 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>Row-level Filtering</strong> - Only get updates for specific rows</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-4">WebSocket Endpoint</h4>
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">WebSocket URL</div>
                <div className="font-mono text-sm text-slate-700">wss://realtime.nextmavens.cloud</div>
              </div>
            </div>
          </div>

          {/* Storage Service */}
          <div className="bg-white border border-slate-200 rounded-2xl p-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 stroke-emerald-700" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Storage Service</h3>
                <p className="text-slate-600">
                  Telegram-based file storage with unlimited capacity and global CDN delivery.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">How It Works</h4>
              <ol className="space-y-2 text-slate-600">
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">1.</span>
                  <span>Send files to <strong>@nextmavensuploadsbot</strong> on Telegram</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">2.</span>
                  <span>Receive a <strong>File ID</strong> for each uploaded file</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">3.</span>
                  <span>Use the File ID to get file info and download URLs</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-600 font-bold">4.</span>
                  <span>Store the File ID in your database alongside your records</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
