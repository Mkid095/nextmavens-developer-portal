import type { CodeLanguage } from '@/components/LanguageSelector'
import type { ServiceType } from '@/lib/types/service-status.types'
import type { ServiceEndpoints } from '../types'

export interface ServiceTabComponentProps {
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
