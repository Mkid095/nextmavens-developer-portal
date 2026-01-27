const features = [
  {
    icon: (
      <svg className="w-7 h-7 stroke-emerald-700" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <ellipse cx="12" cy="5" rx="3" />
        <path d="M21 12c0 1.66-1.34 3-3 3s-3-1.34-3-3m0 0c-1.66 0-3 1.34-3 3s1.34 3 3 3m0-6c-1.66 0-3 1.34-3 3s1.34 3 3 3m0 6c-1.66 0-3 1.34-3 3s1.34 3 3 3" />
      </svg>
    ),
    title: 'Multi-tenant Database',
    description: 'PostgreSQL with Row-Level Security for complete data isolation between tenants.',
    items: ['Auto-generated REST API', 'GraphQL endpoint', 'Row-Level Security (RLS)', 'Automatic migrations'],
  },
  {
    icon: (
      <svg className="w-7 h-7 stroke-emerald-700" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Enterprise Authentication',
    description: 'JWT-based auth with user management, social logins, and fine-grained permissions.',
    items: ['User registration & login', 'Password reset flows', 'JWT tokens with refresh', 'Role-based access control'],
  },
  {
    icon: (
      <svg className="w-7 h-7 stroke-emerald-700" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Realtime Sync',
    description: 'WebSocket subscriptions for instant database updates across all connected clients.',
    items: ['PostgreSQL LISTEN/NOTIFY', 'Per-table subscriptions', 'Row-level filtering', 'Auto-reconnection'],
  },
  {
    icon: (
      <svg className="w-7 h-7 stroke-emerald-700" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    title: 'Telegram Storage',
    description: 'Unlimited file storage via Telegram integration with CDN delivery.',
    items: ['Unlimited storage', 'Global CDN', 'Multiple file types', 'Auto-generated URLs'],
  },
  {
    icon: (
      <svg className="w-7 h-7 stroke-emerald-700" fill="none" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H5m14 0h2m-2 6h2M9 3l6 6m-6 0L3 9m6 3v6m0-6v-6" />
      </svg>
    ),
    title: 'MCP Server',
    description: 'Model Context Protocol for seamless AI/IDE integration with your backend.',
    items: ['Claude Desktop support', 'ChatGPT integration', 'Database query tools', 'Auth & storage tools'],
  },
]

export default function Features() {
  return (
    <section id="features" className="py-20">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything you need</h2>
          <p className="text-lg text-slate-600 max-w-[600px] mx-auto">
            Powerful services to build any backend, from simple APIs to complex enterprise systems.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-2xl p-8 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:translate-y-[-4px] hover:border-emerald-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center mb-5">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{feature.description}</p>
              <ul className="space-y-1.5">
                {feature.items.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-center gap-2 py-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
