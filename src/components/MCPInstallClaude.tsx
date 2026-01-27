export default function MCPInstallClaude() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Claude Code</h3>
          <p className="text-sm text-slate-600">Install via CLI command</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1: Install */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">
            1. Add MCP Server (HTTP Transport)
          </h4>
          <div className="bg-slate-900 rounded-xl p-5 overflow-x-auto">
            <pre className="text-sm text-slate-100 font-mono">
              <code className="text-emerald-300">
                {`# Basic syntax
claude mcp add --transport http nextmavens https://api.nextmavens.cloud/mcp

# With API key
claude mcp add --transport http nextmavens https://api.nextmavens.cloud/mcp \\
  --header "Authorization: Bearer nm_live_pk_your_key_here"`}
              </code>
            </pre>
          </div>
        </div>

        {/* Step 2: Set API Key */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">2. Set API Key (Alternative)</h4>
          <p className="text-sm text-slate-600 mb-3">
            Instead of passing the API key in the command, you can set it as an environment
            variable:
          </p>
          <div className="bg-slate-900 rounded-xl p-5 overflow-x-auto">
            <pre className="text-sm text-slate-100 font-mono">
              <code className="text-emerald-300">
                {`export NEXTMAVENS_API_KEY=nm_live_pk_your_key_here
claude mcp add --transport http nextmavens https://api.nextmavens.cloud/mcp`}
              </code>
            </pre>
          </div>
        </div>

        {/* Step 3: Verify */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">3. Verify Installation</h4>
          <div className="bg-slate-900 rounded-xl p-5 overflow-x-auto">
            <pre className="text-sm text-slate-100 font-mono">
              <code className="text-emerald-300">
                {`# List all configured MCP servers
claude mcp list

# Get details for NextMavens
claude mcp get nextmavens

# Remove server
claude mcp remove nextmavens`}
              </code>
            </pre>
          </div>
        </div>

        {/* Project Scope */}
        <div className="bg-slate-50 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Installation Scopes</h4>
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              <strong>Local (default):</strong> Only available in current project directory
            </p>
            <p>
              <strong>Project:</strong> Shared with team via .mcp.json file
            </p>
            <p>
              <strong>User:</strong> Available across all your projects
            </p>
          </div>
          <div className="mt-4 bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-slate-100 font-mono">
              <code className="text-emerald-300">
                {`# Add to project scope
claude mcp add --transport http nextmavens --scope project https://api.nextmavens.cloud/mcp`}
              </code>
            </pre>
          </div>
        </div>

        {/* Usage */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Usage in Claude Code</h4>
          <p className="text-sm text-slate-600 mb-3">
            Once installed, you can ask Claude Code to use NextMavens tools:
          </p>
          <div className="bg-slate-50 rounded-xl p-5 space-y-3">
            <div className="text-sm">
              <span className="text-slate-500">You:</span>
              <span className="text-slate-700 ml-2">
                Query the users table and show me the last 10 users created
              </span>
            </div>
            <div className="text-sm">
              <span className="text-emerald-600">Claude:</span>
              <span className="text-slate-700 ml-2">
                [Uses nextmavens_query tool with filters]
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
