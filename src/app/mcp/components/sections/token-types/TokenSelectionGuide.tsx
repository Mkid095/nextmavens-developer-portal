/**
 * Token Selection Guide
 *
 * A guide to help users choose the right token type.
 */

import { Eye, Edit3, Lock } from 'lucide-react'

export function TokenSelectionGuide() {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
      <h2 className="text-2xl font-bold mb-6">Which token type should I use?</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold">Start Here</h3>
          </div>
          <p className="text-slate-300 text-sm mb-3">
            Use <code className="bg-white/20 px-2 py-0.5 rounded text-blue-300">mcp_ro_</code> for:
          </p>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Exploring your data</li>
            <li>• Generating reports</li>
            <li>• Code review and analysis</li>
            <li>• Documentation assistance</li>
          </ul>
        </div>

        <div className="bg-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold">Need to Modify?</h3>
          </div>
          <p className="text-slate-300 text-sm mb-3">
            Use <code className="bg-white/20 px-2 py-0.5 rounded text-amber-300">mcp_rw_</code> for:
          </p>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Creating migrations</li>
            <li>• Data processing tasks</li>
            <li>• Trusted AI coding tools</li>
            <li>• Automation scripts</li>
          </ul>
        </div>

        <div className="bg-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500 rounded-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold">Full Control</h3>
          </div>
          <p className="text-slate-300 text-sm mb-3">
            Use <code className="bg-white/20 px-2 py-0.5 rounded text-red-300">mcp_admin_</code> for:
          </p>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• AI DevOps operations</li>
            <li>• Production automation</li>
            <li>• Full lifecycle management</li>
            <li>• Destructive operations needed</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
