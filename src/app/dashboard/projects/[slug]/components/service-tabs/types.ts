/**
 * Service Tabs Types
 */

import type { ServiceEndpoints } from '../../types'

export interface ServiceContent {
  serviceName: string
  overview: string
  whenToUse: string
  getQuickStart: (projectId: string, endpoints: ServiceEndpoints, codeLanguage: string) => React.ReactNode
  connectionDetails: (endpoints: ServiceEndpoints) => React.ReactNode
  docsUrl: string
  additionalSections?: (projectSlug: string) => React.ReactNode | null
}
