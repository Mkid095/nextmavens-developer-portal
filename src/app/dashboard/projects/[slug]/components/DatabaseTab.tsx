import Link from 'next/link'
import { Server, ChevronRight, Database, Copy, Check } from 'lucide-react'
import ServiceTab from '@/components/ServiceTab'
import ServiceStatusIndicator from '@/components/ServiceStatusIndicator'
import LanguageSelector, { type CodeLanguage } from '@/components/LanguageSelector'
import MultiLanguageCodeBlock, { createCodeExamples } from '@/components/MultiLanguageCodeBlock'
import type { Project } from '../types'
import type { ServiceType } from '@/lib/types/service-status.types'

interface DatabaseTabProps {
  project: Project
  codeLanguage: CodeLanguage
  onCodeLanguageChange: (lang: CodeLanguage) => void
  serviceStatus: string
  onToggleService: (service: ServiceType, status: 'enabled' | 'disabled') => void
  updatingService: ServiceType | null
  canManageServices: boolean
  onCopy: (text: string, id: string) => void
  copied: string | null
  endpoints: ReturnType<typeof import('../types').getServiceEndpoints>
}

export function DatabaseTab({
  project,
  codeLanguage,
  onCodeLanguageChange,
  serviceStatus,
  onToggleService,
  updatingService,
  canManageServices,
  onCopy,
  copied,
  endpoints,
}: DatabaseTabProps) {
  const databaseUrl = `postgresql://nextmavens:Elishiba@95@nextmavens-db-m4sxnf.1.mvuvh68efk7jnvynmv8r2jm2u:5432/nextmavens?options=--search_path=tenant_${project.slug}`

  return (
    <>
      {/* US-009: Language Selector for Code Examples */}
      {/* US-010: Service Status Indicator */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Database Service</h2>
          <ServiceStatusIndicator
            service="database"
            status={serviceStatus as any}
            onToggle={canManageServices ? () => onToggleService('database', serviceStatus === 'enabled' ? 'disabled' : 'enabled') : undefined}
            isUpdating={updatingService === 'database'}
            canManage={canManageServices}
          />
        </div>
        <LanguageSelector value={codeLanguage} onChange={onCodeLanguageChange} />
      </div>

      {/* US-011: Add Quick Actions */}
      <div className="mb-6 flex gap-3">
        <Link
          href={`/studio/${project.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          <Server className="w-4 h-4" />
          Open Studio
        </Link>
      </div>

      <ServiceTab
        serviceName="Database"
        overview="A powerful PostgreSQL-powered data service with auto-generated REST & GraphQL APIs. Store, query, and manage your application data with full SQL capabilities while enjoying the convenience of instant API generation."
        whenToUse="Use the Database service for any application that needs persistent data storage - user profiles, content management, e-commerce catalogs, analytics data, or any structured data. Perfect for applications requiring complex queries, transactions, and relational data modeling."
        quickStart={
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Installation</h4>
              <MultiLanguageCodeBlock
                selectedLanguage={codeLanguage}
                examples={createCodeExamples({
                  javascript: '# No installation needed - use fetch API',
                  python: 'pip install requests',
                  go: 'go get github.com/nextmavens/go-sdk',
                  curl: '# No installation needed - cURL comes with most systems',
                })}
              />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
              <MultiLanguageCodeBlock
                selectedLanguage={codeLanguage}
                examples={createCodeExamples({
                  javascript: `// Use fetch API to make requests
const API_KEY = process.env.NEXTMAVENS_API_KEY
const PROJECT_ID = '${project.id || 'YOUR_PROJECT_ID'}'
const BASE_URL = 'https://api.nextmavens.cloud'

async function query(table, options = {}) {
  const response = await fetch(\`\${BASE_URL}/api/projects/\${PROJECT_ID}/\${table}\`, {
    method: options.method || 'GET',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  return response.json()
}`,
                  python: `import nextmavens

client = nextmavens.create_client(
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${project.id || 'YOUR_PROJECT_ID'}'
)`,
                  go: `package main

import "github.com/nextmavens/go-sdk"

func main() {
    client := nextmavens.NewClient(nextmavens.Config{
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${project.id || 'YOUR_PROJECT_ID'}",
    })
}`,
                  curl: `# Set your API key and project ID as environment variables
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${project.id || 'YOUR_PROJECT_ID'}"`,
                })}
              />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Query Example</h4>
              <MultiLanguageCodeBlock
                selectedLanguage={codeLanguage}
                examples={createCodeExamples({
                  javascript: `// Query data
const { data, error } = await client
  .from('users')
  .select('*')
  .limit(10)

// Insert data
const { data } = await client
  .from('users')
  .insert({ email: 'user@example.com' })`,
                  python: `# Query data
response = client.table('users').select('*').limit(10).execute()

# Insert data
response = client.table('users').insert({
    'email': 'user@example.com'
}).execute()`,
                  go: `// Query data
data, err := client.From("users").Select("*").Limit(10).Execute()

// Insert data
data, err := client.From("users").Insert(map[string]interface{}{
    "email": "user@example.com",
}).Execute()`,
                  curl: `# Query data
curl -X GET "${endpoints.rest}/rest/v1/users?limit=10" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Authorization: Bearer $NEXTMAVENS_API_KEY"

# Insert data
curl -X POST "${endpoints.rest}/rest/v1/users" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Authorization: Bearer $NEXTMAVENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com"}'`,
                })}
              />
            </div>
          </div>
        }
        connectionDetails={
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                PostgreSQL Connection String
              </label>
              <div className="relative group">
                <button
                  onClick={() => onCopy(databaseUrl, 'database-url')}
                  className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
                >
                  {copied === 'database-url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
                <pre className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                  <code className="text-sm text-slate-100 font-mono break-all">{databaseUrl}</code>
                </pre>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Security Warning:</strong> Keep your database credentials secure. Never commit
                connection strings to public repositories or expose them in client-side code.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">REST API</p>
                <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">{endpoints.rest}</code>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">GraphQL API</p>
                <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">{endpoints.graphql}</code>
              </div>
            </div>
          </div>
        }
        docsUrl="https://docs.nextmavens.cloud/database"
        additionalSections={
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="font-semibold text-emerald-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/studio/${project.slug}/database`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium"
              >
                <Database className="w-4 h-4" />
                <span>Open Studio</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        }
      />
    </>
  )
}
