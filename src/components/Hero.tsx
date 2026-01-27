import Link from 'next/link'

export default function Hero() {
  return (
    <section className="pt-[140px] pb-20 md:pt-[180px] md:pb-25">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-[-0.03em] text-slate-900 mb-6">
              Build backends
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-transparent bg-clip-text">
                at warp speed.
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-[480px] leading-relaxed mb-8">
              Join thousands of developers who choose <strong>NextMavens</strong> for instant
              backend infrastructure. Database, Auth, Realtime, Storage, and MCP integration in
              one platform.
            </p>
            <div className="flex gap-4 mb-12">
              <button className="btn-primary px-8 py-3.5 text-base">Start Building Free</button>
            </div>

            <div className="grid grid-cols-2 gap-8 max-w-[400px]">
              <div>
                <div className="text-3xl font-bold text-slate-900">5+</div>
                <div className="text-sm text-slate-500">Integrated Services</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">99.9%</div>
                <div className="text-sm text-slate-500">Uptime SLA</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">10ms</div>
                <div className="text-sm text-slate-500">Avg Response</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:translate-y-[-4px] hover:border-emerald-300">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 stroke-emerald-700" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Realtime Updates</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                WebSocket-powered live database changes with auto-reconnection.
              </p>
            </div>

            <Link href="/mcp" className="bg-white border border-slate-200 rounded-2xl p-8 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:translate-y-[-4px] hover:border-emerald-300">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 stroke-emerald-700" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12l6 6m-6 0l6-6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">MCP Integration</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Native support for Model Context Protocol for AI/IDE integration.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
