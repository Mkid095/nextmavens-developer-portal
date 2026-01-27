export default function MCPInstallCursor() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Cursor</h3>
          <p className="text-sm text-slate-600">Configure via mcp.json file</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1: Create mcp.json */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">
            1. Create .cursor/mcp.json
          </h4>
          <p className="text-sm text-slate-600 mb-3">
            Create a new file at <code className="bg-slate-100 px-2 py-1 rounded text-xs">.cursor/mcp.json</code> in your project root:
          </p>
          <div className="bg-slate-900 rounded-xl p-5 overflow-x-auto">
            <pre className="text-sm text-slate-100 font-mono">
              <code className="text-emerald-300">
                {`{
  "mcpServers": {
    "nextmavens": {
      "type": "http",
      "url": "https://api.nextmavens.cloud/mcp",
      "headers": {
        "Authorization": "Bearer nm_live_pk_your_key_here"
      }
    }
  }
}`}
              </code>
            </pre>
          </div>
        </div>

        {/* Step 2: Environment Variables */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">
            2. Using Environment Variables (Recommended)
          </h4>
          <p className="text-sm text-slate-600 mb-3">
            For better security, use environment variables instead of hardcoding your API key:
          </p>
          <div className="bg-slate-900 rounded-xl p-5 overflow-x-auto">
            <pre className="text-sm text-slate-100 font-mono">
              <code className="text-emerald-300">
                {`{
  "mcpServers": {
    "nextmavens": {
      "type": "http",
      "url": "https://api.nextmavens.cloud/mcp",
      "headers": {
        "Authorization": "Bearer \${env:NEXTMAVENS_API_KEY}"
      }
    }
  }
}`}
              </code>
            </pre>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Then set the environment variable in your shell or .env file:
          </p>
          <div className="bg-slate-900 rounded-xl p-4 mt-2 overflow-x-auto">
            <pre className="text-xs text-slate-100 font-mono">
              <code className="text-emerald-300">export NEXTMAVENS_API_KEY=nm_live_pk_your_key_here</code>
            </pre>
          </div>
        </div>

        {/* Step 3: Restart Cursor */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">3. Restart Cursor</h4>
          <p className="text-sm text-slate-600">
            After creating the mcp.json file, restart Cursor to load the MCP server. You can
            verify the connection by checking the MCP tools panel.
          </p>
        </div>

        {/* Transport Options */}
        <div className="bg-slate-50 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Transport Options</h4>
          <p className="text-sm text-slate-600 mb-4">
            Cursor supports multiple transport types for MCP servers:
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">HTTP</span>
              <span className="text-slate-600">Recommended for remote servers (used above)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">SSE</span>
              <span className="text-slate-600">Server-Sent Events for real-time updates</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-600 font-bold">STDIO</span>
              <span className="text-slate-600">Local command-line servers</span>
            </div>
          </div>
        </div>

        {/* OAuth Configuration */}
        <div className="bg-slate-50 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">OAuth Configuration</h4>
          <p className="text-sm text-slate-600 mb-3">
            If NextMavens adds OAuth support in the future, you can configure static OAuth:
          </p>
          <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
            <pre className="text-xs text-slate-100 font-mono">
              <code className="text-emerald-300">
                {`{
  "mcpServers": {
    "nextmavens": {
      "type": "http",
      "url": "https://api.nextmavens.cloud/mcp",
      "auth": {
        "CLIENT_ID": "your_client_id",
        "CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}`}
              </code>
            </pre>
          </div>
        </div>

        {/* Usage */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Usage in Cursor</h4>
          <p className="text-sm text-slate-600 mb-3">
            Once configured, MCP tools appear in Cursor tools panel. Enable/disable tools from
            settings.
          </p>
          <div className="bg-slate-50 rounded-xl p-5 space-y-3">
            <div className="text-sm">
              <span className="text-slate-500">You:</span>
              <span className="text-slate-700 ml-2">Create a new user with email jane@example.com</span>
            </div>
            <div className="text-sm">
              <span className="text-emerald-600">Cursor Agent:</span>
              <span className="text-slate-700 ml-2">[Uses nextmavens_signup tool]</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
