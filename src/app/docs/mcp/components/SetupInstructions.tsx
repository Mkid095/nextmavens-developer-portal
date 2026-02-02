/**
 * Setup Instructions Component
 */

import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

export function SetupInstructions() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Setup Instructions</h2>

      <div className="space-y-6">
        <section>
          <h3 className="font-semibold text-slate-900 mb-3">1. Create MCP Token</h3>
          <p className="text-sm text-slate-600 mb-4">
            Go to the <a href="/" className="text-emerald-700 hover:text-emerald-800">dashboard</a> and create an MCP token
            with the appropriate access level.
          </p>
          <CodeBlockWithCopy>{`// Example: Create read-only MCP token
Token name: "Claude Code Assistant"
Token type: mcp_ro_
Description: "For AI-assisted development"
`}</CodeBlockWithCopy>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-3">2. Configure Claude Code</h3>
          <p className="text-sm text-slate-600 mb-4">Add the MCP server to your Claude Code config file:</p>
          <CodeBlockWithCopy>{`// ~/.claude/mcp.json
{
  "mcpServers": {
    "nextmavens": {
      "command": "npx",
      "args": ["-y", "@nextmavenspacks/mcp-server"],
      "env": {
        "NEXTMAVENS_API_KEY": "your_mcp_ro_token_here",
        "NEXTMAVENS_API_URL": "https://api.nextmavens.cloud"
      }
    }
  }
}`}</CodeBlockWithCopy>
        </section>

        <section>
          <h3 className="font-semibold text-slate-900 mb-3">3. Use in AI Tools</h3>
          <p className="text-sm text-slate-600 mb-4">Once configured, you can ask Claude Code to:</p>
          <CodeBlockWithCopy>{`// Example queries you can make:
"Query all users from the database"
"Insert a new user record"
"Get the database schema"
"List all files in storage"
"Execute a GraphQL query to get tenant information"
"Create a new bucket in storage"
"Enable realtime on the posts table"`}</CodeBlockWithCopy>
        </section>
      </div>
    </div>
  )
}
