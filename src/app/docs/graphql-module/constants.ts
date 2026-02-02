/**
 * GraphQL Documentation - Module - Constants
 */

export const GRAPHQL_CONFIG = {
  domain: 'https://api.nextmavens.cloud',
  port: 4004,
  graphiqlUrl: null, // Not currently available
  features: ['Auto Schema', 'Relations', 'Mutations', 'Subscriptions'],
} as const

export const CONNECTION_ARGS = [
  { name: 'first', type: 'Int', description: 'Return first N records' },
  { name: 'last', type: 'Int', description: 'Return last N records' },
  { name: 'before', type: 'Cursor', description: 'Cursor for pagination' },
  { name: 'after', type: 'Cursor', description: 'Cursor for pagination' },
  { name: 'orderBy', type: 'Enum', description: 'Sort order (e.g., CREATED_AT_DESC)' },
  { name: 'condition', type: 'Object', description: 'Filter conditions' },
  { name: 'filter', type: 'Object', description: 'Complex filter expression' },
] as const

export const QUERY_EXAMPLES = [
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
