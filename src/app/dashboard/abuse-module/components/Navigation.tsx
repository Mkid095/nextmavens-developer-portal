/**
 * Abuse Dashboard - Navigation Component
 */

import Link from 'next/link'
import { LogOut } from 'lucide-react'

interface NavigationProps {
  onLogout: () => void
}

export function Navigation({ onLogout }: NavigationProps) {
  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="mx-auto max-w-[1400px] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">
              nextmavens
            </span>
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
