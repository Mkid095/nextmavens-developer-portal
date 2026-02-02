import Link from 'next/link'
import { Shield, Code2, ChevronRight, HardDrive } from 'lucide-react'
import ServiceTab from '@/components/ServiceTab'
import ServiceStatusIndicator from '@/components/ServiceStatusIndicator'
import LanguageSelector, { type CodeLanguage } from '@/components/LanguageSelector'
import MultiLanguageCodeBlock from '@/components/MultiLanguageCodeBlock'
import type { ServiceEndpoints } from '../types'
import type { ServiceType } from '@/lib/types/service-status.types'
import { authServiceContent, storageServiceContent, graphqlServiceContent, realtimeServiceContent } from './service-tabs/constants'

interface ServiceTabComponentProps {
  serviceName: 'auth' | 'storage' | 'graphql' | 'realtime'
  project: { slug: string; id: string }
  codeLanguage: CodeLanguage
  onCodeLanguageChange: (lang: CodeLanguage) => void
  serviceStatus: string
  onToggleService: (service: ServiceType, status: 'enabled' | 'disabled') => void
  updatingService: ServiceType | null
  canManageServices: boolean
  endpoints: ServiceEndpoints
}

function ServiceTabHeader({ serviceName, serviceStatus, onToggleService, updatingService, canManageServices, codeLanguage, onCodeLanguageChange }: {
  serviceName: string
  serviceStatus: string
  onToggleService: (service: ServiceType, status: 'enabled' | 'disabled') => void
  updatingService: ServiceType | null
  canManageServices: boolean
  codeLanguage: CodeLanguage
  onCodeLanguageChange: (lang: CodeLanguage) => void
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-slate-900">{serviceName} Service</h2>
        <ServiceStatusIndicator
          service={serviceName as ServiceType}
          status={serviceStatus as any}
          onToggle={canManageServices ? () => onToggleService(serviceName as ServiceType, serviceStatus === 'enabled' ? 'disabled' : 'enabled') : undefined}
          isUpdating={updatingService === serviceName}
          canManage={canManageServices}
        />
      </div>
      <LanguageSelector value={codeLanguage} onChange={onCodeLanguageChange} />
    </div>
  )
}

export function AuthTab({ project, codeLanguage, onCodeLanguageChange, serviceStatus, onToggleService, updatingService, canManageServices, endpoints }: Omit<ServiceTabComponentProps, 'serviceName'>) {
  return (
    <>
      <ServiceTabHeader
        serviceName="Auth"
        serviceStatus={serviceStatus}
        onToggleService={onToggleService}
        updatingService={updatingService}
        canManageServices={canManageServices}
        codeLanguage={codeLanguage}
        onCodeLanguageChange={onCodeLanguageChange}
      />
      <ServiceTab
        serviceName={authServiceContent.serviceName}
        overview={authServiceContent.overview}
        whenToUse={authServiceContent.whenToUse}
        quickStart={authServiceContent.getQuickStart(project.id, endpoints, codeLanguage)}
        connectionDetails={authServiceContent.connectionDetails(endpoints)}
        docsUrl={authServiceContent.docsUrl}
        additionalSections={
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="font-semibold text-emerald-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link href={`/studio/${project.slug}/auth/users`} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium">
                <Shield className="w-4 h-4" />
                <span>Manage Users</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        }
      />
    </>
  )
}

export function StorageTab({ project, codeLanguage, onCodeLanguageChange, serviceStatus, onToggleService, updatingService, canManageServices, endpoints }: Omit<ServiceTabComponentProps, 'serviceName'>) {
  return (
    <>
      <ServiceTabHeader
        serviceName="Storage"
        serviceStatus={serviceStatus}
        onToggleService={onToggleService}
        updatingService={updatingService}
        canManageServices={canManageServices}
        codeLanguage={codeLanguage}
        onCodeLanguageChange={onCodeLanguageChange}
      />
      <ServiceTab
        serviceName={storageServiceContent.serviceName}
        overview={storageServiceContent.overview}
        whenToUse={storageServiceContent.whenToUse}
        quickStart={storageServiceContent.getQuickStart(project.id, endpoints, codeLanguage)}
        connectionDetails={storageServiceContent.connectionDetails(endpoints)}
        docsUrl={storageServiceContent.docsUrl}
        additionalSections={
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="font-semibold text-emerald-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link href={`/studio/${project.slug}/storage/buckets`} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium">
                <HardDrive className="w-4 h-4" />
                <span>Create Bucket</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        }
      />
    </>
  )
}

export function GraphqlTab({ project, codeLanguage, onCodeLanguageChange, serviceStatus, onToggleService, updatingService, canManageServices, endpoints }: Omit<ServiceTabComponentProps, 'serviceName'>) {
  return (
    <>
      <ServiceTabHeader
        serviceName="GraphQL"
        serviceStatus={serviceStatus}
        onToggleService={onToggleService}
        updatingService={updatingService}
        canManageServices={canManageServices}
        codeLanguage={codeLanguage}
        onCodeLanguageChange={onCodeLanguageChange}
      />
      <div className="mb-6 flex gap-3">
        <Link href={`/studio/${project.slug}/graphql/playground`} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
          <Code2 className="w-4 h-4" />
          Open GraphQL Playground
        </Link>
      </div>
      <ServiceTab
        serviceName={graphqlServiceContent.serviceName}
        overview={graphqlServiceContent.overview}
        whenToUse={graphqlServiceContent.whenToUse}
        quickStart={graphqlServiceContent.getQuickStart(project.id, endpoints, codeLanguage)}
        connectionDetails={graphqlServiceContent.connectionDetails(endpoints)}
        docsUrl={graphqlServiceContent.docsUrl}
        additionalSections={null}
      />
    </>
  )
}

export function RealtimeTab({ project, codeLanguage, onCodeLanguageChange, serviceStatus, onToggleService, updatingService, canManageServices, endpoints }: Omit<ServiceTabComponentProps, 'serviceName'>) {
  return (
    <>
      <ServiceTabHeader
        serviceName="Realtime"
        serviceStatus={serviceStatus}
        onToggleService={onToggleService}
        updatingService={updatingService}
        canManageServices={canManageServices}
        codeLanguage={codeLanguage}
        onCodeLanguageChange={onCodeLanguageChange}
      />
      <ServiceTab
        serviceName={realtimeServiceContent.serviceName}
        overview={realtimeServiceContent.overview}
        whenToUse={realtimeServiceContent.whenToUse}
        quickStart={realtimeServiceContent.getQuickStart(project.id, endpoints, codeLanguage)}
        connectionDetails={realtimeServiceContent.connectionDetails(endpoints)}
        docsUrl={realtimeServiceContent.docsUrl}
        additionalSections={null}
      />
    </>
  )
}
