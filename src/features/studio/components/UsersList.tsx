'use client'

import { Users } from 'lucide-react'

export interface User {
  id: string
  email: string
  name: string | null
  created_at: string
  last_sign_in_at: string | null
}

interface UsersListProps {
  users: User[]
  loading: boolean
}

export function UsersList({ users, loading }: UsersListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Users className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-900 mb-2">No users yet</h2>
        <p className="text-slate-600">Users will appear here once they sign up</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Created</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Last Sign In</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900 font-medium">{user.email}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{user.name || '-'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
