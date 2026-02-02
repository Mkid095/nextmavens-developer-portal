/**
 * Backups Documentation - Documentation Link Component
 */

import { ArrowLeft } from 'lucide-react'

export function DocumentationLink() {
  return (
    <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Complete Documentation</h3>
      <p className="text-slate-600 mb-4">
        For detailed information about backup architecture, API endpoints, restore procedures, and
        troubleshooting, view the complete backup strategy documentation.
      </p>
      <a
        href="https://github.com/nextmavens/next-mavens-flow/blob/main/docs/backup-strategy/README.md"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium"
      >
        View Full Backup Documentation
        <ArrowLeft className="w-4 h-4 rotate-180" />
      </a>
    </section>
  )
}
