'use client'

import { motion } from 'framer-motion'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

const databaseExamples = [
  {
    title: 'Query with GraphQL',
    description: 'Use GraphQL to fetch data with precise control over fields and relationships',
    code: `// Query data using GraphQL
const response = await fetch('https://api.nextmavens.cloud/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${process.env.NEXTMAVENS_API_KEY}\`
  },
  body: JSON.stringify({
    query: \`{
      allUsers {
        nodes {
          id
          email
          name
          createdAt
        }
      }
    }\`
  })
});

const { data, errors } = await response.json();`,
  },
  {
    title: 'Query with Filtering',
    description: 'Filter and sort results using GraphQL',
    code: `// Query with filters and ordering
const response = await fetch('https://api.nextmavens.cloud/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${process.env.NEXTMAVENS_API_KEY}\`
  },
  body: JSON.stringify({
    query: \`{
      allUsers(
        orderBy: CREATED_AT_DESC
        condition: { status: "active" }
        first: 10
      ) {
        nodes {
          id
          email
          name
        }
      }
    }\`
  })
});`,
  },
  {
    title: 'Create with Mutation',
    description: 'Insert new records using GraphQL mutations',
    code: `// Create a new record
const response = await fetch('https://api.nextmavens.cloud/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${process.env.NEXTMAVENS_API_KEY}\`
  },
  body: JSON.stringify({
    query: \`mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        user {
          id
          email
          name
        }
      }
    }\`,
    variables: {
      input: {
        user: {
          email: 'user@example.com',
          name: 'John Doe',
          passwordHash: 'hashed_password'
        }
      }
    }
  })
});`,
  },
  {
    title: 'Update with Mutation',
    description: 'Modify existing records using GraphQL mutations',
    code: `// Update a record
const response = await fetch('https://api.nextmavens.cloud/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${process.env.NEXTMAVENS_API_KEY}\`
  },
  body: JSON.stringify({
    query: \`mutation UpdateUser($id: Int!, $patches: UserPatch!) {
      updateUserById(input: { id: $id, userPatch: $patches }) {
        user {
          id
          email
          name
        }
      }
    }\`,
    variables: {
      id: 1,
      patches: {
        name: 'Jane Doe',
        status: 'active'
      }
    }
  })
});`,
  },
  {
    title: 'Delete with Mutation',
    description: 'Remove records using GraphQL mutations',
    code: `// Delete a record
const response = await fetch('https://api.nextmavens.cloud/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${process.env.NEXTMAVENS_API_KEY}\`
  },
  body: JSON.stringify({
    query: \`mutation DeleteUser($id: Int!) {
      deleteUserById(input: { id: $id }) {
        deletedUserId
      }
    }\`,
    variables: {
      id: 1
    }
  })
});`,
  },
  {
    title: 'Query with Relations',
    description: 'Fetch related data in a single query',
    code: `// Query with related data
const response = await fetch('https://api.nextmavens.cloud/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${process.env.NEXTMAVENS_API_KEY}\`
  },
  body: JSON.stringify({
    query: \`{
      allUsers {
        nodes {
          id
          email
          name
          apiKeysByUserId {
            nodes {
              id
              keyPrefix
              scopes
            }
          }
        }
      }
    }\`
  })
});`,
  },
]

export function SdkDatabase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Database Operations</h2>
      <p className="text-slate-600 mb-6">
        Use GraphQL to interact with the database. The GraphQL endpoint provides type-safe queries,
        mutations, and automatic schema generation from your database.
      </p>
      <div className="space-y-6 mb-12">
        {databaseExamples.map((example, index) => (
          <motion.div
            key={example.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-1">{example.title}</h3>
              <p className="text-slate-600">{example.description}</p>
            </div>
            <div className="p-6">
              <CodeBlockWithCopy>{example.code}</CodeBlockWithCopy>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
