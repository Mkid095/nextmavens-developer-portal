/**
 * Realtime Service Content
 */

import { createCodeExamples } from '@/components/MultiLanguageCodeBlock'
import type { ServiceEndpoints } from '../../../types'
import MultiLanguageCodeBlock from '@/components/MultiLanguageCodeBlock'
import type { ServiceContent } from '../types'

export const realtimeServiceContent: ServiceContent = {
  serviceName: 'Realtime',
  overview: 'A real-time data synchronization service powered by PostgreSQL Change Data Capture (CDC). Subscribe to database changes and receive instant updates via WebSocket connections. Perfect for collaborative apps, live dashboards, and multi-user experiences.',
  whenToUse: 'Use the Realtime service when you need live data updates in your application. Ideal for collaborative editing, live dashboards, chat applications, notifications, activity feeds, and any scenario where users need to see changes instantly across multiple clients.',
  getQuickStart: (projectId: string, endpoints: ServiceEndpoints) => (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
        <MultiLanguageCodeBlock
          examples={createCodeExamples({
            javascript: `import { createRealtimeClient } from '@nextmavens/realtime'

const realtime = createRealtimeClient({
  url: '${endpoints.realtime}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${projectId}'
})`,
            python: `import nextmavens_realtime

realtime = nextmavens_realtime.create_client(
    url='${endpoints.realtime}',
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${projectId}'
)`,
            go: `package main

import "github.com/nextmavens/go-realtime"

func main() {
    realtime := gorealtime.NewClient(gorealtime.Config{
        URL: "${endpoints.realtime}",
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${projectId}",
    })
}`,
            curl: `# Set your API key and project ID
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${projectId}"
export REALTIME_URL="${endpoints.realtime}"`,
          })}
        />
      </div>
      <div>
        <h4 className="font-semibold text-slate-900 mb-2">Connect to WebSocket</h4>
        <MultiLanguageCodeBlock
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
  ),
  connectionDetails: (endpoints: ServiceEndpoints) => (
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
  ),
  docsUrl: 'https://docs.nextmavens.cloud/realtime',
}
