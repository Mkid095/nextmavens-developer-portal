import type { Tab, TabConfig } from '../types'
import { TABS } from '../types'
import ServiceStatusIndicator from '@/components/ServiceStatusIndicator'
import type { ServiceType } from '@/lib/types/service-status.types'

interface TabNavigationProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  serviceStatuses: Record<string, string>
  onToggleService: (service: ServiceType, status: 'enabled' | 'disabled') => void
  updatingService: ServiceType | null
  canManageServices: boolean
}

export function TabNavigation({
  activeTab,
  onTabChange,
  serviceStatuses,
  onToggleService,
  updatingService,
  canManageServices,
}: TabNavigationProps) {
  const serviceTabs: Tab[] = ['database', 'auth', 'storage', 'realtime', 'graphql']

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
      {TABS.map((tab) => {
        const isServiceTab = serviceTabs.includes(tab.id)
        const serviceStatus = isServiceTab ? serviceStatuses[tab.id] : null

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
            {isServiceTab && serviceStatus && (
              <ServiceStatusIndicator
                service={tab.id as ServiceType}
                status={serviceStatus as any}
                onToggle={() => onToggleService(tab.id as ServiceType, serviceStatus === 'enabled' ? 'disabled' : 'enabled')}
                isUpdating={updatingService === tab.id}
                canManage={canManageServices}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
