/**
 * GraphQL Service Content
 */

import { createCodeExamples } from '@/components/MultiLanguageCodeBlock'
import type { ServiceEndpoints } from '../../../types'
import MultiLanguageCodeBlock from '@/components/MultiLanguageCodeBlock'
import type { ServiceContent } from '../types'

export const graphqlServiceContent: ServiceContent = {
  serviceName: 'GraphQL',
  overview: 'A powerful GraphQL API automatically generated from your database schema. Query your data with flexible, type-safe GraphQL operations. No manual API development required - the schema reflects your database structure in real-time.',
  whenToUse: 'Use the GraphQL service when you need flexible, efficient data fetching. Perfect for frontend applications, mobile apps, and any scenario where clients need to query exactly the data they need. Ideal for complex data relationships, nested queries, and avoiding over-fetching.',
  getQuickStart: (projectId: string, endpoints: ServiceEndpoints) => (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
        <MultiLanguageCodeBlock
          examples={createCodeExamples({
            javascript: `import { createGraphQLClient } from '@nextmavens/graphql'

const graphql = createGraphQLClient({
  url: '${endpoints.graphql}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${projectId}'
})`,
            python: `import nextmavens_graphql

graphql = nextmavens_graphql.create_client(
    url='${endpoints.graphql}',
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${projectId}'
)`,
            go: `package main

import "github.com/nextmavens/go-graphql"

func main() {
    graphql := gographql.NewClient(gographql.Config{
        URL: "${endpoints.graphql}",
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${projectId}",
    })
}`,
            curl: `# Set your API key and project ID
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${projectId}"
export GRAPHQL_URL="${endpoints.graphql}"`,
          })}
        />
      </div>
      <div>
        <h4 className="font-semibold text-slate-900 mb-2">Query Example</h4>
        <MultiLanguageCodeBlock
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
  ),
  connectionDetails: (endpoints: ServiceEndpoints) => (
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
  ),
  docsUrl: 'https://docs.nextmavens.cloud/graphql',
}
