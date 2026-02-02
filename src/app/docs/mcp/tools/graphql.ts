/**
 * MCP Tools - GraphQL
 */

import type { ToolCategory } from '../types'
import { Code2 } from 'lucide-react'

export const graphqlTools: ToolCategory = {
  category: 'GraphQL',
  icon: Code2,
  tools: [
    {
      name: 'nextmavens_graphql',
      description: 'Execute a GraphQL query',
      inputSchema: {
        query: { type: 'string', required: true },
        variables: { type: 'object', description: 'GraphQL variables' }
      },
      scopes: ['graphql:execute'],
    },
    {
      name: 'nextmavens_graphql_introspect',
      description: 'Get GraphQL schema introspection for exploring available types and fields',
      inputSchema: {},
      scopes: ['graphql:execute'],
    },
  ],
}
