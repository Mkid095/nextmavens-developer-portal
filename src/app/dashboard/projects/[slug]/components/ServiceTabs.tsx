import Link from 'next/link'
import { Shield, Server, Code2, ChevronRight, HardDrive } from 'lucide-react'
import ServiceTab from '@/components/ServiceTab'
import ServiceStatusIndicator from '@/components/ServiceStatusIndicator'
import LanguageSelector from '@/components/LanguageSelector'
import MultiLanguageCodeBlock, { createCodeExamples } from '@/components/MultiLanguageCodeBlock'
import type { CodeLanguage, ServiceEndpoints } from '../types'
import type { ServiceType } from '@/lib/types/service-status.types'

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

export function AuthTab({ project, codeLanguage, onCodeLanguageChange, serviceStatus, onToggleService, updatingService, canManageServices, endpoints }: Omit<ServiceTabComponentProps, 'serviceName'>) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Auth Service</h2>
          <ServiceStatusIndicator service="auth" status={serviceStatus as any} onToggle={canManageServices ? () => onToggleService('auth', serviceStatus === 'enabled' ? 'disabled' : 'enabled') : undefined} isUpdating={updatingService === 'auth'} canManage={canManageServices} />
        </div>
        <LanguageSelector value={codeLanguage} onChange={onCodeLanguageChange} />
      </div>
      <ServiceTab
        serviceName="Authentication"
        overview="A complete authentication and user management system. Handle sign-ups, logins, password resets, and social providers with minimal code. Built-in security with JWT tokens and row-level security integration."
        whenToUse="Use the Auth service for any application requiring user authentication. Perfect for web apps, mobile apps, and APIs that need secure user management, social logins, and protected routes."
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
        connectionDetails={
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Auth Endpoint</p>
              <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">{endpoints.auth}</code>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Security:</strong> All passwords are hashed using bcrypt. JWT tokens are signed with RS256 and expire after 1 hour by default.
              </p>
            </div>
          </div>
        }
        docsUrl="https://docs.nextmavens.cloud/auth"
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Storage Service</h2>
          <ServiceStatusIndicator service="storage" status={serviceStatus as any} onToggle={canManageServices ? () => onToggleService('storage', serviceStatus === 'enabled' ? 'disabled' : 'enabled') : undefined} isUpdating={updatingService === 'storage'} canManage={canManageServices} />
        </div>
        <LanguageSelector value={codeLanguage} onChange={onCodeLanguageChange} />
      </div>
      <ServiceTab
        serviceName="Storage"
        overview="A scalable file storage service with built-in CDN delivery. Upload, transform, and serve images, videos, and documents. Features include automatic image optimization, on-the-fly transformations, and signed URL generation for secure access."
        whenToUse="Use the Storage service for any file handling needs - user avatars, document uploads, media galleries, backups, or any static assets. Perfect for applications requiring secure file storage with fast global delivery."
        quickStart={
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
              <MultiLanguageCodeBlock
                selectedLanguage={codeLanguage}
                examples={createCodeExamples({
                  javascript: `import { createStorageClient } from '@nextmavens/storage'

const storage = createStorageClient({
  url: '${endpoints.storage}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project.id}'
})`,
                  python: `import nextmavens_storage

storage = nextmavens_storage.create_client(
    url='${endpoints.storage}',
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${project.id}'
)`,
                  go: `package main

import "github.com/nextmavens/go-storage"

func main() {
    storage := gostorage.NewClient(gostorage.Config{
        URL: "${endpoints.storage}",
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${project.id}",
    })
}`,
                  curl: `# Set your API key and project ID
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${project.id}"
export STORAGE_URL="${endpoints.storage}"`,
                })}
              />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Upload File</h4>
              <MultiLanguageCodeBlock
                selectedLanguage={codeLanguage}
                examples={createCodeExamples({
                  javascript: `const { data, error } = await storage.upload('avatars', file, {
    upsert: false
  })`,
                  python: `response = storage.upload(
    bucket='avatars',
    file=file,
    options={'upsert': False}
).execute()`,
                  go: `data, err := storage.Upload("avatars", file, gostorage.UploadOptions{
    Upsert: false,
})`,
                  curl: `curl -X POST "$STORAGE_URL/v1/object/avatars/filename.jpg" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Authorization: Bearer $NEXTMAVENS_API_KEY" \\
  -H "Content-Type: image/jpeg" \\
  --data-binary "@/path/to/file.jpg"`,
                })}
              />
            </div>
          </div>
        }
        connectionDetails={
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Storage Endpoint</p>
              <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">{endpoints.storage}</code>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>CDN Enabled:</strong> All files are automatically served through a global CDN for fast delivery. Image transformations are cached at the edge.
              </p>
            </div>
          </div>
        }
        docsUrl="https://docs.nextmavens.cloud/storage"
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900">GraphQL Service</h2>
          <ServiceStatusIndicator service="graphql" status={serviceStatus as any} onToggle={canManageServices ? () => onToggleService('graphql', serviceStatus === 'enabled' ? 'disabled' : 'enabled') : undefined} isUpdating={updatingService === 'graphql'} canManage={canManageServices} />
        </div>
        <LanguageSelector value={codeLanguage} onChange={onCodeLanguageChange} />
      </div>
      <div className="mb-6 flex gap-3">
        <Link href={`/studio/${project.slug}/graphql/playground`} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
          <Code2 className="w-4 h-4" />
          Open GraphQL Playground
        </Link>
      </div>
      <ServiceTab
        serviceName="GraphQL"
        overview="A powerful GraphQL API automatically generated from your database schema. Query your data with flexible, type-safe GraphQL operations. No manual API development required - the schema reflects your database structure in real-time."
        whenToUse="Use the GraphQL service when you need flexible, efficient data fetching. Perfect for frontend applications, mobile apps, and any scenario where clients need to query exactly the data they need. Ideal for complex data relationships, nested queries, and avoiding over-fetching."
        quickStart={
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
              <MultiLanguageCodeBlock
                selectedLanguage={codeLanguage}
                examples={createCodeExamples({
                  javascript: `import { createGraphQLClient } from '@nextmavens/graphql'

const graphql = createGraphQLClient({
  url: '${endpoints.graphql}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project.id}'
})`,
                  python: `import nextmavens_graphql

graphql = nextmavens_graphql.create_client(
    url='${endpoints.graphql}',
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${project.id}'
)`,
                  go: `package main

import "github.com/nextmavens/go-graphql"

func main() {
    graphql := gographql.NewClient(gographql.Config{
        URL: "${endpoints.graphql}",
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${project.id}",
    })
}`,
                  curl: `# Set your API key and project ID
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${project.id}"
export GRAPHQL_URL="${endpoints.graphql}"`,
                })}
              />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Query Example</h4>
              <MultiLanguageCodeBlock
                selectedLanguage={codeLanguage}
                examples={createCodeExamples({
                  javascript: `const { data, error } = await graphql.query(\`query {
  users(limit: 10, order_by: { created_at: desc }) {
    id
    email
    created_at
  }
}\`)`,
                  python: `query = """
query {
  users(limit: 10, order_by: { created_at: desc }) {
    id
    email
    created_at
  }
}
"""

result = graphql.query(query)`,
                  go: `query := \`query {
  users(limit: 10, order_by: { created_at: desc }) {
    id
    email
    created_at
  }
}\`

result, err := graphql.Query(query)`,
                  curl: `curl -X POST "$GRAPHQL_URL/graphql" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "query { users(limit: 10) { id email } }"
  }'`,
                })}
              />
            </div>
          </div>
        }
        connectionDetails={
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">GraphQL Endpoint</p>
              <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">{endpoints.graphql}</code>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>Auto-generated Schema:</strong> The GraphQL schema is automatically generated from your database schema. Any changes to tables are immediately reflected in the GraphQL API.
              </p>
            </div>
          </div>
        }
        docsUrl="https://docs.nextmavens.cloud/graphql"
        additionalSections={null}
      />
    </>
  )
}

export function RealtimeTab({ project, codeLanguage, onCodeLanguageChange, serviceStatus, onToggleService, updatingService, canManageServices, endpoints }: Omit<ServiceTabComponentProps, 'serviceName'>) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Realtime Service</h2>
          <ServiceStatusIndicator service="realtime" status={serviceStatus as any} onToggle={canManageServices ? () => onToggleService('realtime', serviceStatus === 'enabled' ? 'disabled' : 'enabled') : undefined} isUpdating={updatingService === 'realtime'} canManage={canManageServices} />
        </div>
        <LanguageSelector value={codeLanguage} onChange={onCodeLanguageChange} />
      </div>
      <ServiceTab
        serviceName="Realtime"
        overview="A real-time data synchronization service powered by PostgreSQL Change Data Capture (CDC). Subscribe to database changes and receive instant updates via WebSocket connections. Perfect for collaborative apps, live dashboards, and multi-user experiences."
        whenToUse="Use the Realtime service when you need live data updates in your application. Ideal for collaborative editing, live dashboards, chat applications, notifications, activity feeds, and any scenario where users need to see changes instantly across multiple clients."
        quickStart={
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
              <MultiLanguageCodeBlock
                selectedLanguage={codeLanguage}
                examples={createCodeExamples({
                  javascript: `import { createRealtimeClient } from '@nextmavens/realtime'

const realtime = createRealtimeClient({
  url: '${endpoints.realtime}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${project.id}'
})`,
                  python: `import nextmavens_realtime

realtime = nextmavens_realtime.create_client(
    url='${endpoints.realtime}',
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${project.id}'
)`,
                  go: `package main

import "github.com/nextmavens/go-realtime"

func main() {
    realtime := gorealtime.NewClient(gorealtime.Config{
        URL: "${endpoints.realtime}",
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${project.id}",
    })
}`,
                  curl: `# Set your API key and project ID
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${project.id}"
export REALTIME_URL="${endpoints.realtime}"`,
                })}
              />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Connect to WebSocket</h4>
              <MultiLanguageCodeBlock
                selectedLanguage={codeLanguage}
                examples={createCodeExamples({
                  javascript: `const { socket, error } = await realtime.connect()

socket.on('connected', () => {
  console.log('Connected to realtime!')
})`,
                  python: `socket = await realtime.connect()

@socket.on('connected')
def on_connected():
    print('Connected to realtime!')`,
                  go: `socket, err := realtime.Connect()
if err != nil {
    log.Fatal(err)
}

socket.On("connected", func() {
    fmt.Println("Connected to realtime!")
})`,
                  curl: `# Connect using websocat or wscat
TOKEN=$(curl -s -X POST "$REALTIME_URL/v1/auth/token" \\
  -H "apikey: $NEXTMAVENS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"project_id": "'"$PROJECT_ID"'"}' | jq -r '.token')

wscat -c "$REALTIME_URL/v1/realtime?token=$TOKEN"`,
                })}
              />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Subscribe to Table Changes</h4>
              <MultiLanguageCodeBlock
                selectedLanguage={codeLanguage}
                examples={createCodeExamples({
                  javascript: `const subscription = socket
  .channel('users')
  .on('INSERT', (payload) => {
    console.log('New user:', payload.new)
  })
  .subscribe()`,
                  python: `@socket.channel('users')
def on_insert(payload):
    print(f'New user: {payload["new"]}')

subscription = socket.subscribe('users')`,
                  go: `subscription := socket.Channel("users").
    On("INSERT", func(payload map[string]interface{}) {
        fmt.Println("New user:", payload["new"])
    }).
    Subscribe()`,
                  curl: `echo '{"event": "phx_join", "topic": "users", "payload": {"events": ["INSERT", "UPDATE"]}}' | \\
  wscat -c "$REALTIME_URL/v1/realtime?token=$TOKEN"`,
                })}
              />
            </div>
          </div>
        }
        connectionDetails={
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">WebSocket URL</p>
              <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">{endpoints.realtime}</code>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Change Data Capture:</strong> Realtime uses PostgreSQL's logical replication to capture row-level changes. All INSERT, UPDATE, and DELETE operations are broadcast in real-time to subscribed clients.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Protocol</p>
                <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">WebSocket</code>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Latency</p>
                <code className="text-sm text-slate-900 bg-white px-2 py-1 rounded border">&lt; 100ms</code>
              </div>
            </div>
          </div>
        }
        docsUrl="https://docs.nextmavens.cloud/realtime"
        additionalSections={null}
      />
    </>
  )
}
