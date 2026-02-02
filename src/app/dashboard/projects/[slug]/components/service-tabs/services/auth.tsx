/**
 * Auth Service Content
 */

import { createCodeExamples } from '@/components/MultiLanguageCodeBlock'
import type { ServiceEndpoints } from '../../../types'
import MultiLanguageCodeBlock from '@/components/MultiLanguageCodeBlock'
import type { ServiceContent } from '../types'

export const authServiceContent: ServiceContent = {
  serviceName: 'Authentication',
  overview: 'A complete authentication and user management system. Handle sign-ups, logins, password resets, and social providers with minimal code. Built-in security with JWT tokens and row-level security integration.',
  whenToUse: 'Use the Auth service for any application requiring user authentication. Perfect for web apps, mobile apps, and APIs that need secure user management, social logins, and protected routes.',
  getQuickStart: (projectId: string, endpoints: ServiceEndpoints) => (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-slate-900 mb-2">Initialize Client</h4>
        <MultiLanguageCodeBlock
          examples={createCodeExamples({
            javascript: `import { createAuthClient } from '@nextmavens/auth'

const auth = createAuthClient({
  url: '${endpoints.auth}',
  apiKey: process.env.NEXTMAVENS_API_KEY,
  projectId: '${projectId}'
})`,
            python: `import nextmavens_auth

auth = nextmavens_auth.create_client(
    url='${endpoints.auth}',
    api_key=os.environ['NEXTMAVENS_API_KEY'],
    project_id='${projectId}'
)`,
            go: `package main

import "github.com/nextmavens/go-auth"

func main() {
    auth := goauth.NewClient(goauth.Config{
        URL: "${endpoints.auth}",
        APIKey: os.Getenv("NEXTMAVENS_API_KEY"),
        ProjectID: "${projectId}",
    })
}`,
            curl: `# Set your API key and project ID
export NEXTMAVENS_API_KEY="your_api_key_here"
export PROJECT_ID="${projectId}"
export AUTH_URL="${endpoints.auth}"`,
          })}
        />
      </div>
      <div>
        <h4 className="font-semibold text-slate-900 mb-2">Sign Up Example</h4>
        <MultiLanguageCodeBlock
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
  ),
  connectionDetails: (endpoints: ServiceEndpoints) => (
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
  ),
  docsUrl: 'https://docs.nextmavens.cloud/auth',
}
