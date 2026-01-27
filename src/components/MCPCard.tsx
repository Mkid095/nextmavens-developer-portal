export default function MCPCard() {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-12 text-white">
      <div className="grid md:grid-cols-2 gap-12">
        {/* What is MCP */}
        <div>
          <h2 className="text-2xl font-bold mb-4">What is MCP?</h2>
          <p className="text-slate-300 leading-relaxed mb-8">
            The Model Context Protocol (MCP) is an open standard that allows AI assistants to
            seamlessly connect to external tools and data sources. Think of it as a universal
            plug-in system for AI applications.
          </p>

          <h3 className="text-lg font-semibold mb-4">Why Use NextMavens MCP?</h3>
          <ul className="space-y-3">
            {[
              'Query databases with natural language',
              'Create and manage users through chat',
              'Upload and manage files via AI',
              'Inspect schema and get context',
              'Full database, auth, and storage tools',
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-300 text-sm">
                <span className="text-emerald-400">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Start */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            Install the NextMavens MCP server and connect it to your AI assistant.
          </p>

          <div className="bg-black/30 rounded-xl p-5 mb-6">
            <code className="text-sm text-emerald-300 font-mono">
              pnpm add -g @nextmavens/mcp-server
            </code>
          </div>

          <h3 className="text-lg font-semibold mb-4">Get Your API Key</h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            Sign up at{' '}
            <a
              href="https://portal.nextmavens.cloud"
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              portal.nextmavens.cloud
            </a>{' '}
            to get your free API key.
          </p>

          <h3 className="text-lg font-semibold mb-4">Set Environment Variable</h3>
          <div className="bg-black/30 rounded-xl p-5 font-mono text-sm">
            <pre className="text-emerald-300">
              export NEXTMAVENS_API_KEY=nm_live_pk_your_key_here
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
