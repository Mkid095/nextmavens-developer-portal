export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 text-center">
      <div className="container-custom">
        <div className="flex flex-wrap justify-center gap-8 mb-6">
          <a
            href="https://github.com/Mkid095/nextmavens-js"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            JavaScript SDK
          </a>
          <a
            href="https://github.com/Mkid095/nextmavens-mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            MCP Server
          </a>
          <a
            href="https://github.com/Mkid095/nextmavens-developer-portal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Developer Portal
          </a>
          <a
            href="https://github.com/Mkid095/nextmavens-api-gateway"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            API Gateway
          </a>
        </div>
        <div className="text-sm text-slate-400">
          © 2026 NextMavens, Inc. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
