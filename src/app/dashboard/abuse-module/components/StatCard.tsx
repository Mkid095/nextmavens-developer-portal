/**
 * Abuse Dashboard - Stat Card Component
 */

import type { LucideIcon, LucideProps } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  iconColor: string
  bgColor: string
  label: string
  value: number | string
  subtext: string
}

export function StatCard({ icon: Icon, iconColor, bgColor, label, value, subtext }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="font-medium text-slate-900">{label}</span>
      </div>
      <div className="text-3xl font-semibold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-600">{subtext}</div>
    </div>
  )
}
