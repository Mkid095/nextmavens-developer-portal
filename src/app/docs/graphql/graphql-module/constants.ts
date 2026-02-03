/**
 * GraphQL Docs Module - Constants
 */

import type { GraphQLConfig, QueryExample, ConnectionArg } from './types'

/**
 * GraphQL service configuration
 */
export const GRAPHQL_CONFIG: GraphQLConfig = {
  domain: 'https://api.nextmavens.cloud',
  port: 4004,
  graphiqlUrl: null,
  features: ['Auto Schema', 'Relations', 'Mutations', 'Subscriptions'],
} as const

/**
 * Query examples for documentation
 */
export const QUERY_EXAMPLES: QueryExample[] = [
  {
    title: 'Query Single Record',
    code: `query GetUser($id: Int!) {
  userById(id: $id) {
    id
    email
    name
    createdAt
  }
}`,
    variables: { id: 1 },
  },
  {
    title: 'Query with Relations',
    code: `query GetUserWithKeys($userId: Int!) {
  userById(id: $userId) {
    id
    email
    name
    apiKeysByUserId {
      nodes {
        id
        keyPrefix
        scopes
        createdAt
      }
    }
  }
}`,
    variables: { userId: 1 },
  },
  {
    title: 'Create Record (Mutation)',
    code: `mutation CreateApiKey($input: CreateApiKeyInput!) {
  createApiKey(input: $input) {
    apiKey {
      id
      keyPrefix
      scopes
      userId
    }
  }
}`,
    variables: {
      input: {
        apiKey: {
          userId: 1,
          keyPrefix: 'pk_test',
          scopes: ['read', 'write'],
        },
      },
    },
  },
  {
    title: 'Update Record (Mutation)',
    code: `mutation UpdateApiKey($id: Int!, $patches: ApiKeyPatch!) {
  updateApiKeyById(input: { id: $id, apiKeyPatch: $patches }) {
    apiKey {
      id
      keyPrefix
      scopes
    }
  }
}`,
    variables: {
      id: 1,
      patches: { scopes: ['read', 'write', 'delete'] },
    },
  },
] as const

/**
 * Connection arguments for Relay-style pagination
 */
export const CONNECTION_ARGS: ConnectionArg[] = [
  { name: 'first', type: 'Int', description: 'Return first N records' },
  { name: 'last', type: 'Int', description: 'Return last N records' },
  { name: 'before', type: 'Cursor', description: 'Cursor for pagination' },
  { name: 'after', type: 'Cursor', description: 'Cursor for pagination' },
  { name: 'orderBy', type: 'Enum', description: 'Sort order (e.g., CREATED_AT_DESC)' },
  { name: 'condition', type: 'Object', description: 'Filter conditions' },
  { name: 'filter', type: 'Object', description: 'Complex filter expression' },
] as const

/**
 * Code example snippets
 */
export const CODE_EXAMPLES = {
  USING_FETCH: `const response = await fetch('https://api.nextmavens.cloud/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    query: \`query GetUser(\$id: Int!) {
      userById(id: \$id) {
        id
        email
        name
      }
    }\`,
    variables: { id: 1 }
  })
});

const { data, errors } = await response.json();`,

  INTROSPECTION: `{
  __type(name: "User") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}`,

  USING_CLIENTS: `# Example with curl
curl -X POST https://api.nextmavens.cloud/graphql \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"query":"{ __schema { types { name } } }"}'

# Or use Apollo Explorer: https://explorer.apollographql.com`,
} as const

/**
 * Postgraphile feature descriptions
 */
export const POSTGRAPHILE_FEATURES = [
  {
    title: 'Auto-generated',
    description: 'Schema is generated from database tables and relationships automatically.',
  },
  {
    title: 'Relay Support',
    description: 'Cursor-based pagination for efficient data fetching.',
  },
  {
    title: 'Type Safe',
    description: 'Full TypeScript support with typed queries and responses.',
  },
] as const
