import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import MCPCard from '@/components/MCPCard'
import MCPTools from '@/components/MCPTools'
import MCPInstallClaude from '@/components/MCPInstallClaude'
import MCPInstallCursor from '@/components/MCPInstallCursor'

export default function MCPPage() {
  return (
    <>
      <Navigation />
      <main className="pt-[140px] pb-20">
        <div className="container-custom">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">
              MCP Server & AI Integration
            </h1>
            <p className="text-xl text-slate-600 max-w-[700px] mx-auto">
              Connect your backend to AI assistants with Model Context Protocol.
              Full support for Claude Code, Cursor, Continue.dev, and more.
            </p>
          </div>

          {/* What is MCP */}
          <MCPCard />

          {/* Installation Guides */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
              Installation Guides
            </h2>

            <div className="grid lg:grid-cols-2 gap-8">
              <MCPInstallClaude />
              <MCPInstallCursor />
            </div>
          </div>

          {/* Available Tools */}
          <MCPTools />

          {/* Example Conversations */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
              Example Conversations
            </h2>

            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-slate-50 rounded-2xl p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">With Claude Code:</h3>
                <div className="bg-white rounded-lg p-6 font-mono text-sm text-slate-700">
                  <div className="text-slate-400 mb-2">You:</div>
                  <div className="mb-4">Show me all users created in the last 7 days</div>
                  <div className="text-emerald-600 mb-2">Claude:</div>
                  <div>[Uses nextmavens_query tool to filter and display results]</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Database Management:</h3>
                <div className="bg-white rounded-lg p-6 font-mono text-sm text-slate-700">
                  <div className="text-slate-400 mb-2">You:</div>
                  <div className="mb-4">Create a new user with email john@example.com</div>
                  <div className="text-emerald-600 mb-2">Claude:</div>
                  <div>[Uses nextmavens_signup tool with parsed data]</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Schema Exploration:</h3>
                <div className="bg-white rounded-lg p-6 font-mono text-sm text-slate-700">
                  <div className="text-slate-400 mb-2">You:</div>
                  <div className="mb-4">What tables exist in my database?</div>
                  <div className="text-emerald-600 mb-2">Claude:</div>
                  <div>[Uses nextmavens_graphql_introspect tool to show schema]</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
