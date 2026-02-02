import Link from 'next/link'
import { Shield, ChevronRight } from 'lucide-react'
import ServiceTab from '@/components/ServiceTab'
import ServiceStatusIndicator from '@/components/ServiceStatusIndicator'
import LanguageSelector, { type CodeLanguage } from '@/components/LanguageSelector'
import MultiLanguageCodeBlock, { createCodeExamples } from '@/components/MultiLanguageCodeBlock'
import type { ServiceEndpoints } from '../types'
import type { ServiceType } from '@/lib/types/service-status.types'
import {
  SERVICE_CONFIG,
  createQuickActionLink,
  createConnectionDetails,
  createSecurityInfo
} from './constants'

export interface AuthServiceTabProps {
  project: { slug: string; id: string }
  codeLanguage: CodeLanguage
  onCodeLanguageChange: (lang: CodeLanguage) => void
  serviceStatus: string
  onToggleService: (service: ServiceType, status: 'enabled' | 'disabled') => void
  updatingService: ServiceType | null
  canManageServices: boolean
  endpoints: ServiceEndpoints
}

export function AuthServiceTab({ project, codeLanguage, onCodeLanguageChange, serviceStatus, onToggleService, updatingService, canManageServices, endpoints }: AuthServiceTabProps) {
  const config = SERVICE_CONFIG.auth

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900">{config.title}</h2>
          <ServiceStatusIndicator
            service="auth"
            status={serviceStatus as any}
            onToggle={canManageServices ? () => onToggleService('auth', serviceStatus === 'enabled' ? 'disabled' : 'enabled') : undefined}
            isUpdating={updatingService === 'auth'}
            canManage={canManageServices}
          />
        </div>
        <LanguageSelector value={codeLanguage} onChange={onCodeLanguageChange} />
      </div>
      <ServiceTab
        serviceName="Authentication"
        overview={config.overview}
        whenToUse={config.whenToUse}
        quickStart={
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
              <MultiLanguageCodeBlock
                selectedLanguage={codeLanguage}
                examples={createCodeExamples({
                  javascript: `import { createAuthClient } from '@nextmavens/auth'

const auth = createAuthClient({
  url: '${endpoints.auth}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project.id}'
})`,
                  python: `import nextmavens_auth

auth = nextmavens_auth.create_client(
    url='${endpoints.auth}',
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${project.id}'
)`,
                  go: `package main

import "github.com/nextmavens/go-auth"

func main() {
    auth := goauth.NewClient(goauth.Config{
        URL: "${endpoints.auth}",
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${project.id}",
    })
}`,
                  curl: `# Set your API key and project ID
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${project.id}"
export AUTH_URL="${endpoints.auth}"`,
                })}
              />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Sign Up Example</h4>
              <MultiLanguageCodeBlock
                selectedLanguage={codeLanguage}
                examples={createCodeExamples({
                  javascript: `const { data, error } = await auth.signUp({
  email: 'user@example.com',
  password: 'secure-password'
})`,
                  python: `response = auth.sign_up(
    email='user@example.com',
    password='secure-password'
).execute()`,
                  go: `data, err := auth.SignUp(goauth.SignUpParams{
    Email: "user@example.com",
    Password: "secure-password",
})`,
                  curl: `curl -X POST "$AUTH_URL/v1/auth/signup" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "secure-password"}'`,
                })}
              />
            </div>
          </div>
        }
        connectionDetails={createConnectionDetails(endpoints, 'auth')}
        docsUrl={config.docsUrl}
        additionalSections={
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="font-semibold text-emerald-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              {createQuickActionLink(project.slug, config.quickActionSubPath, config.quickActionText, config.quickActionIcon)}
            </div>
          </div>
        }
      />
    </>
  )
}
