/**
 * Abuse Dashboard - Dashboard Content Component
 */

import { Shield, Activity, AlertTriangle, Eye } from 'lucide-react'
import type { DashboardData } from '../types'
import { StatCard } from './StatCard'
import { CapViolationsList } from './CapViolationsList'
import { SuspiciousPatternsList } from './SuspiciousPatternsList'
import { SuspensionsByType } from './SuspensionsByType'

interface DashboardContentProps {
  dashboardData: DashboardData
}

export function DashboardContent({ dashboardData }: DashboardContentProps) {
  return (
    <>
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          icon={Shield}
          iconColor="text-red-700"
          bgColor="bg-red-100"
          label="Suspensions"
          value={dashboardData.suspensions.total}
          subtext={`${dashboardData.suspensions.active} active`}
        />
        <StatCard
          icon={Activity}
          iconColor="text-orange-700"
          bgColor="bg-orange-100"
          label="Rate Limits"
          value={dashboardData.rate_limits.total}
          subtext="Total hits"
        />
        <StatCard
          icon={AlertTriangle}
          iconColor="text-amber-700"
          bgColor="bg-amber-100"
          label="Cap Violations"
          value={dashboardData.cap_violations.total}
          subtext="Projects exceeded limits"
        />
        <StatCard
          icon={Eye}
          iconColor="text-purple-700"
          bgColor="bg-purple-100"
          label="Suspicious Patterns"
          value={dashboardData.suspicious_patterns.total}
          subtext="Pattern detections"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Cap Violations</h2>
          </div>
          <div className="p-6">
            <CapViolationsList violations={dashboardData.cap_violations.violations} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Suspicious Patterns</h2>
          </div>
          <div className="p-6">
            <SuspiciousPatternsList patterns={dashboardData.suspicious_patterns.recent} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Suspensions by Type</h2>
        </div>
        <div className="p-6">
          <SuspensionsByType suspensionsByType={dashboardData.suspensions.by_type} />
        </div>
      </div>
    </>
  )
}
