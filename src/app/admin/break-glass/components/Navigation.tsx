/**
 * Navigation Component
 * Top navigation bar for break glass console
 */

import { useRouter } from 'next/navigation'
import { Shield, Clock } from 'lucide-react'

interface NavigationProps {
  authenticated: boolean
  formattedTime: string
}

export function Navigation({ authenticated, formattedTime }: NavigationProps) {
  const router = useRouter()

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">
            Break Glass Console
          </span>
        </div>

        <div className="flex items-center gap-4">
          {authenticated && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-lg">
              <Clock className="w-4 h-4 text-amber-700" />
              <span className="text-sm font-medium text-amber-800">{formattedTime}</span>
            </div>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Exit
          </button>
        </div>
      </div>
    </nav>
  )
}
